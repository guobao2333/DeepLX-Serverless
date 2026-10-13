/**
 * DeepL oneshot 新版接口
 */
const DEEPL_URL = 'https://oneshot-free.www.deepl.com/v1/translate',
      REQUEST_TIMEOUT_MS = 10000,
      MAX_TEXT_LENGTH = 1500;

/** DeepL 目标语言（含区域变体） */
const TARGET_LANGUAGES = [
  'en-US', 'en-GB',
  'zh-Hans', 'zh-Hant',
  'pt-BR', 'pt-PT',
  'de', 'fr', 'es', 'it', 'ja', 'ko', 'ru', 'nl', 'pl', 'tr',
  'ar', 'bg', 'cs', 'da', 'el', 'et', 'fi', 'hu', 'id', 'lt',
  'lv', 'nb', 'ro', 'sk', 'sl', 'sv', 'uk'
];

/**
 * 翻译入口
 *
 * @param {string} text        待翻译文本
 * @param {string} sourceLang  源语言（"AUTO" / "" / "EN" / "ZH" ...）
 * @param {string} targetLang  目标语言（"ZH" / "ZH-HANS" / "EN-US" ...）
 * @param {boolean} [printResult]
 */
async function translate(text, sourceLang, targetLang, printResult) {
  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ code: 400, message: 'Bad Request' });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ code: 400, message: `Text too long: ${text.length} > ${MAX_TEXT_LENGTH}` });
  }

  const normalizedSource = normalizeSourceLanguage(sourceLang);
  const normalizedTarget = normalizeTargetLanguage(targetLang);

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
    // 仅在网络错误 / 超时时抛异常
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      const e = new Error('Upstream request timeout');
      e.code = 'ETIMEDOUT';
      e.name = 'TranslateError';
      throw e;
    }
    console.error('[ERROR] translate:', err.message);
    throw err;
  }

  // HTTP 状态判断
  if (response.status === 429) {
    return { code: 429, message: 'Too Many Requests' };
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('Response parse failure: invalid JSON');
  }

  return parseResponse(body, normalizedSource, normalizedTarget, printResult);
}

/** 解析 oneshot 返回数据 */
function parseResponse(body, sourceLang, targetLang, printResult) {
  if (printResult) console.log('[RESP]', JSON.stringify(body));

  const translations = body?.translations;
  if (!Array.isArray(translations) || translations.length === 0) {
    throw new Error('Response parse failure: translations missing');
  }

  const first = translations[0];
  const translatedText = first?.text;
  const detectedLang = first?.detected_source_language || '';

  if (!translatedText) {
    throw new Error('Response parse failure: empty translation');
  }

  const result = {
    code: 200,
    id: Math.floor(Math.random() * 1000000),
    method: 'Free',
    data: translatedText,
    source_lang: (sourceLang === 'auto'
      ? detectedLang
      : sourceLang
    ).toUpperCase(),
    target_lang: targetLang.toUpperCase(),
    alternatives: [] // oneshot 不提供备选
  };

  if (printResult) console.log('[RESULT]', result);
  return result;
}

/**
 * 源语言标准化
 * - 空 → "auto"
 * - 含区域变体（"en-US"）→ 取基础语言 "en"
 */
function normalizeSourceLanguage(input) {
  if (!input || typeof input !== 'string' || input.trim() === '') return 'auto';
  const trimmed = input.trim();
  if (trimmed.toLowerCase() === 'auto') return 'auto';

  const base = trimmed.includes('-') ? trimmed.split('-')[0] : trimmed;
  return base.toLowerCase();
}

/**
 * 目标语言标准化
 * - 优先匹配完整变体（忽略大小写）
 * - 基础语言映射到常用区域变体
 */
function normalizeTargetLanguage(input) {
  if (!input || typeof input !== 'string' || input.trim() === '' ||
      input.toLowerCase() === 'auto') {
    throw new Error(`Unsupported target language: ${input}`);
  }
  const trimmed = input.trim();

  for (const lang of TARGET_LANGUAGES) {
    if (lang.toLowerCase() === trimmed.toLowerCase()) return lang;
  }

  const mapped = {
    en: 'en-US',
    zh: 'zh-Hans',
    pt: 'pt-BR'
  }[trimmed.toLowerCase()];

  if (mapped) {
    for (const lang of TARGET_LANGUAGES) {
      if (lang.toLowerCase() === mapped.toLowerCase()) return mapped;
    }
  }

  return trimmed;
}

export { translate };