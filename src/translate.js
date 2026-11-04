/**
 * DeepL oneshot 新版 Web API
 *
 * 上游规范：
 *   POST https://oneshot-free.www.deepl.com/v1/translate
 *   - 鉴权：无需；Authorization 头填 'None' 仅为占位
 *   - 请求体：{ text: string[], target_lang: string, source_lang?: string }
 *     · text          字符串数组；单条上限 1500 字符（按 Unicode 码点计）
 *     · target_lang   必填；大小写敏感，见 toUpstreamCode()
 *     · source_lang   可选；大小写敏感，**留空/省略即自动检测**
 *   - 响应体：{ translations: [{ text, detected_source_language }] }
 *   - 429 可能带 Retry-After 响应头；超时按 REQUEST_TIMEOUT_MS 中止
 */

const DEEPL_URL = 'https://oneshot-free.www.deepl.com/v1/translate',
      REQUEST_TIMEOUT_MS = 10000,
      MAX_TEXT_LENGTH = 1500;

/**
 * 上游支持的语言码全集（大小写不敏感匹配）。
 * 源语言与目标语言的合法范围共用此集合；两者对“裸基础码”的接受度
 * 不同，由 normalizeSourceLanguage / normalizeTargetLanguage 各自处理。
 */
const SUPPORTED_LANGUAGES = [
  "zh", "zh-Hans", "zh-Hant", "en", "en-US", "en-GB", "es", "de", "ja", "fr", "pt", "pt-BR", "pt-PT", "ru", "ko", "it", "nl", "pl", "tr", "sv", "cs", "da", "fi", "hu", "el", "uk", "ro", "sk", "sl", "bg", "lt", "lv", "et", "nb", "id",
"ar", "hi", "bn", "ur", "vi", "th", "ta", "ms", "fa", "ha", "sw", "ne", "my", "km", "am", "he", "sr", "hr", "ca", "eu", "gl", "ka", "hy", "az", "kk", "ky", "uz", "tg", "tk",
  "ml", "mr", "gu", "pa", "te", "kn", "si", "sd", "zu", "xh", "st", "sn", "so", "mt", "mi", "mg", "cy", "eo", "sq", "mk", "bs", "is", "ga", "af", "fy", "ht", "la", "tl", "ceb", "su",
  "jv", "yo", "ig", "hmn", "ny", "co", "haw", "sm", "gd", "yi", "ace", "an", "as", "ay", "ba", "bho", "br", "ckb", "gom", "gn", "ilo", "kmr", "ln", "lmo", "mai", "oc", "om", "pag",
  "pam", "prs", "qu", "sa", "scn", "tn", "ts", "wo", "yue"
];

/**
 * 翻译入口
 *
 * 逻辑约定：
 *   - 源语言为自动检测（空串）时**不写入** source_lang 字段，交由上游检测；
 *   - 其它情况写入 source_lang，值是经 toUpstreamCode() 规范化后的上游写法；
 *   - target_lang 始终必填，同样经 toUpstreamCode() 转换。
 *
 * 返回约定：
 *   - 成功返回 { code: 200, id, method, data, source_lang, target_lang, alternatives }；
 *   - 参数错误 / 上游 429 时返回 { code: 400|429, message, ... }；
 *   - 网络/协议异常抛 makeError(...)，由 app.js 映射为 502/504。
 *
 * @param {string} text            待翻译文本
 * @param {string} sourceLang      源语言（'AUTO' / '' / 'EN' / 'ZH' ...，大小写不敏感）
 * @param {string} targetLang      目标语言（'ZH' / 'ZH-HANS' / 'EN-US' ...，大小写不敏感）
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
    target_lang: toUpstreamCode(normalizedTarget),
    ...(normalizedSource && { source_lang: toUpstreamCode(normalizedSource) }),
  };

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
    throw makeError('TranslateError', `Upstream unreachable${causeCode ? ': ' + causeCode : ''}`,
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

  return parseResponse(body, {
    detected: !normalizedSource,
    source: typeof sourceLang === 'string' ? sourceLang.trim() : '',
    target: typeof targetLang === 'string' ? targetLang.trim() : ''
  }, printResult);
}


/**
 * 解析 oneshot 返回数据。
 *
 * 响应格式（成功）：
 *   { translations: [{ text: string, detected_source_language?: string }] }
 *
 * 回显策略：
 *   - echoLang.detected 为 true（调用方未指定源语言）时，source_lang 回显上游识别结果；
 *   - 否则回显调用方原始写法，避免破坏依赖大小写的旧客户端；
 *   - target_lang 始终回显调用方原始写法。
 *
 * @param {any} body            上游 JSON
 * @param {{detected:boolean, source:string, target:string}} echoLang
 * @param {boolean} [printResult]
 */
function parseResponse(body, echoLang, printResult) {
  if (printResult) console.log('[RESP]', JSON.stringify(body));

  const translations = body?.translations;
  if (!Array.isArray(translations) || translations.length === 0) {
    throw makeError('UpstreamError', 'Response parse failure: translations missing');
  }

  // 兼容性写法，暂时保留以免上游回滚 :)
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
    // 回显调用方原写法；自动检测时展示上游识别结果
    source_lang: echoLang.detected ? detectedLang : echoLang.source,
    target_lang: echoLang.target,
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


const LANGUAGES = new Set(SUPPORTED_LANGUAGES.map(l => l.toUpperCase()));

/**
 * 把内部规范码转换成 oneshot 接口接受的写法。
 *
 * 上游写法规则（BCP 47 风格，大小写敏感）：
 *   - 基础语言：全小写            EN       → en
 *   - 脚本子标签：首字母大写       ZH-HANS  → zh-Hans
 *   - 地区子标签：全大写           EN-US    → en-US
 *
 * 子标签长度判据来自 ISO 标准：
 *   - 脚本（ISO 15924）恒为 4 位字母，故 length === 4 视为脚本；
 *   - 地区（ISO 3166-1 alpha-2）为 2 位字母，进入地区分支。
 *
 * @param {string} code 内部规范码（非空串）
 * @returns {string} 上游写法
 */
function toUpstreamCode(code) {
  const [base, ...rest] = code.split('-');
  if (rest.length === 0) return base.toLowerCase();
  const sub = rest.join('-');
  if (sub.length === 4) {
    // 脚本子标签，如 Hans / Hant
    return `${base.toLowerCase()}-${sub[0]}${sub.slice(1).toLowerCase()}`;
  }
  // 地区子标签，如 US / GB / BR
  return `${base.toLowerCase()}-${sub.toUpperCase()}`;
}

/**
 * 目标语言标准化
 *
 * 输入大小写不敏感 → 输出大写内部规范码
 * 上游要求目标语言带区域变体，裸基础码不合法，故先映射：
 *   - 'ZH' → 'ZH-HANS'；'PT' → 'PT-BR'
 *   - zh-* 变体：TW/HK/MO/HANT → ZH-HANT，其余 → ZH-HANS
 *   - en-* 变体：GB → EN-GB，US → EN-US，其余 → EN
 *   - pt-* 变体：PT → PT-PT，其余 → PT-BR
 *   - 其余精确命中 LANGUAGES → 原样大写返回
 *   - 其余剥离 region 后若基础码受支持则回退
 *   - null / 非字符串 / 空串 / 'AUTO' → null
 *
 * @param {string} input
 * @returns {string|null}
 */
function normalizeTargetLanguage(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim().toUpperCase();
  if (!trimmed || trimmed === 'AUTO') return null;

  if (trimmed === 'ZH') return 'ZH-HANS';
  if (trimmed === 'PT') return 'PT-BR';
  if (LANGUAGES.has(trimmed)) return trimmed;

  const [base, ...rest] = trimmed.split('-');
  const region = rest.join('-');
  if (base === 'ZH') {
    if (['TW', 'HK', 'MO', 'HANT'].includes(region)) return 'ZH-HANT';
    return 'ZH-HANS';
  }

  if (base === 'EN') {
    if (region === 'GB') return 'EN-GB';
    if (region === 'US') return 'EN-US';
    return 'EN';
  }

  if (base === 'PT') return region === 'PT' ? 'PT-PT' : 'PT-BR';

  if (LANGUAGES.has(base)) return base;

  return null;
}

/**
 * 源语言标准化
 *
 *   - 空串与 auto 表示自动检测
 *   - null 表示非法，返回 400
 *   - 精确命中 LANGUAGES → 大写规范码
 *   - 否则取基础码，受支持则回退到基础码
 *   - 无法识别 → null
 *
 * @param {string} input
 * @returns {string|null} 空串=自动检测；大写码=指定语言；null=非法
 */
function normalizeSourceLanguage(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim().toUpperCase();
  if (!trimmed || trimmed === 'AUTO') return '';

  if (LANGUAGES.has(trimmed)) return trimmed;

  const [base] = trimmed.split('-');
  if (LANGUAGES.has(base)) return base;

  return null;
}

export { translate };