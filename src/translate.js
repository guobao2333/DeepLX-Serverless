/**
 * DeepL oneshot 新版接口
 */
const DEEPL_URL = 'https://oneshot-free.www.deepl.com/v1/translate',
      REQUEST_TIMEOUT_MS = 10000,
      MAX_TEXT_LENGTH = 1500;

/** DeepL 目标语言（含区域变体） */
const TARGET_LANGUAGES = [
        "zh", "zh-Hans", "zh-Hant", "en", "en-US", "en-GB", "es", "de", "ja", "fr", "pt", "pt-BR", "pt-PT", "ru", "ko", "it", "nl", "pl", "tr", "sv", "cs", "da", "fi", "hu", "el", "uk", "ro", "sk", "sl", "bg", "lt", "lv", "et", "nb", "id",
      "ar", "hi", "bn", "ur", "vi", "th", "ta", "ms", "fa", "ha", "sw", "ne", "my", "km", "am", "he", "sr", "hr", "ca", "eu", "gl", "ka", "hy", "az", "kk", "ky", "uz", "tg", "tk",
        "ml", "mr", "gu", "pa", "te", "kn", "si", "sd", "zu", "xh", "st", "sn", "so", "mt", "mi", "mg", "cy", "eo", "sq", "mk", "bs", "is", "ga", "af", "fy", "ht", "la", "tl", "ceb", "su",
        "jv", "yo", "ig", "hmn", "ny", "co", "haw", "sm", "gd", "yi", "ace", "an", "as", "ay", "ba", "bho", "br", "ckb", "gom", "gn", "ilo", "kmr", "ln", "lmo", "mai", "oc", "om", "pag",
        "pam", "prs", "qu", "sa", "scn", "tn", "ts", "wo", "yue"
];

/**
 * 翻译入口
 *
 * @param {string} text        待翻译文本
 * @param {string} sourceLang  源语言（"AUTO" / "" / "EN" / "ZH" ...）
 * @param {string} targetLang  目标语言（"ZH" / "ZH-HANS" / "EN-US" ...）
 * @param {boolean} [printResult]  打印调试信息（console.log）
 */
async function translate(text, sourceLang, targetLang, printResult) {
  if (typeof text !== 'string' || text.trim() === '') {
    return { code: 400, message: 'Bad Request' };
  }

  let len = [...text].length;
  if (len > MAX_TEXT_LENGTH) {
    return { code: 400, message: `Text too long: ${len} > ${MAX_TEXT_LENGTH}` };
  }

  const normalizedSource = normalizeSourceLanguage(sourceLang);
  if (normalizedSource === null) {
    return { code: 400, message: `Unsupported source language: ${sourceLang}` };
  }

  const normalizedTarget = normalizeTargetLanguage(targetLang);
  if (!normalizedTarget) {
    return { code: 400, message: `Unsupported target language: ${targetLang}` };
  }

  // 构造请求体
  const postData = {
    text: [text],
    target_lang: normalizedTarget
  };
  if (normalizedSource !== 'auto') {
    postData.source_lang = normalizedSource;
  }

  if (printResult) console.log('[REQ]', JSON.stringify(postData));

  let response;
  try {
    response = await fetch(DEEPL_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'None', // oneshot 无需鉴权
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify(postData),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw makeError('TranslateError', 'Upstream request timeout', { code: 'ETIMEDOUT' });
    }
    const causeCode = err.cause?.code || err.cause?.message;
    throw makeError('TranslateError', `Upstream unreachable${causeCode ? `: ${causeCode}` : ''}`,
      { cause: err, code: causeCode || 'ENETWORK' },
    );
  }

  // HTTP 状态判断
  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after');
    return { code: 429, message: 'Too Many Requests',
      ...(retryAfter && { retry_after: retryAfter }),
    };
  }

  // 其余状态
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw makeError(
      'UpstreamError', `Upstream returned HTTP ${response.status}`,
      { cause: { status: response.status, body: errorText } },
    );
  }

  let body;
  try { body = await response.json(); } catch {
    throw makeError('UpstreamError', 'Response parse failure: invalid JSON');
  }

  return parseResponse(body, normalizedSource, normalizedTarget, printResult);
}


/** 解析 oneshot 返回数据 */
function parseResponse(body, sourceLang, targetLang, printResult) {
  if (printResult) console.log('[RESP]', JSON.stringify(body));

  const translations = body?.translations;
  if (!Array.isArray(translations) || translations.length === 0) {
    throw makeError('UpstreamError', 'Response parse failure: translations missing');
  }

  const first = translations[0];
  const translatedText = first?.text;
  const detectedLang = first?.detected_source_language || '';

  if (!translatedText) {
    throw makeError('UpstreamError', 'Response parse failure: empty translation');
  }

  const result = {
    code: 200,
    id: Math.floor(Math.random() * 1000000),
    method: 'Free',
    data: translatedText,
    source_lang: (sourceLang == 'auto'
      ? detectedLang
      : sourceLang
    ).toLowerCase(),
    target_lang: targetLang.toLowerCase(),
    alternatives: [] // oneshot 不提供备选
  };

  if (printResult) console.log('[RESULT]', result);
  return result;
}


function makeError(name, message, { code, cause } = {}) {
  const e = cause !== undefined
    ? new Error(message, { cause })
    : new Error(message);
  e.name = name;
  if (code !== undefined) e.code = code;
  e.expose = true;
  return e;
}


const TARGET_LANG_SET = new Set(TARGET_LANGUAGES.map(l => l.toUpperCase()));

/**
 * 目标语言标准化
 * - 精确匹配 TARGET_LANGUAGES（忽略大小写）
 * - 中文变体 → 简繁；英文变体 → US/GB；葡语变体 → BR/PT
 * - 其余剥离 region 后若基础语言受支持则回退
 * - 无法识别返回 null
 */
function normalizeTargetLanguage(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.toLowerCase() === 'auto') return null;

  const upper = trimmed.toUpperCase();
  if (TARGET_LANG_SET.has(upper)) return upper;

  const [base, ...rest] = upper.split('-');
  const region = rest.join('-');
  if (base === 'ZH') {
    if (['TW', 'HK', 'MO', 'HANT'].includes(region)) return 'ZH-HANT';
    if (['CN', 'SG', 'HANS'].includes(region)) return 'ZH-HANS';
    return 'ZH';
  }

  if (base === 'EN') {
    if (region === 'GB') return 'EN-GB';
    if (region === 'US') return 'EN-US';
    return 'EN';
  }

  if (base === 'PT') return region === 'PT' ? 'PT-PT' : 'PT-BR';

  if (TARGET_LANG_SET.has(base)) return base;

  return null;
}

/**
 * 源语言标准化
 * - 空 → 'auto'
 * - 受支持的语言（含区域变体）→ 大写基础代码
 * - 无法识别 → null
 */
function normalizeSourceLanguage(input) {
  if (!input || typeof input !== 'string') return 'auto';
  const trimmed = input.trim();
  if (!trimmed || trimmed.toLowerCase() === 'auto') return 'auto';

  const upper = trimmed.toUpperCase();
  if (TARGET_LANG_SET.has(upper)) return upper;

  const base = upper.split('-')[0];
  if (TARGET_LANG_SET.has(base)) return base;

  return null;
}

export { translate };