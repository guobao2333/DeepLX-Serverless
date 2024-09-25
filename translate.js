import axios from 'axios';
import lodash from 'lodash';
const { random } = lodash;

const DEEPL_BASE_URL = 'https://www2.deepl.com/jsonrpc'/*,
  DEEPL_PRO_URL = 'https://api.deepl.com',
  DEEPL_FREE_URL = 'https://api-free.deepl.com'*/;
const headers = {
  'Content-Type': 'application/json',
  Accept: '*/*',
  'x-app-os-name': 'iOS',
  'x-app-os-version': '16.3.0',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'x-app-device': 'iPhone13,2',
  'User-Agent': 'DeepL-iOS/2.9.1 iOS 16.3.0 (iPhone13,2)',
  'x-app-build': '510265',
  'x-app-version': '2.9.1',
  Connection: 'keep-alive',
};

function getICount(translateText) {
  return (translateText || '').split('i').length - 1;
}

function getRandomNumber() {
  return random(8300000, 8399998) * 1000;
}

function getTimestamp(iCount) {
  const ts = Date.now();
  if (iCount === 0) {
    return ts;
  }
  iCount++;
  return ts - (ts % iCount) + iCount;
}

/**
 * @async
 * @param {string} text - 待翻译的文本
 * @param {string} [sourceLang='AUTO'] - 源语言国家/地区代号 默认自动识别
 * @param {string} targetLang - 目标语言国家/地区代号
 * @param {number} [alternativeCount] - 请求的备选翻译数量
 * @param {boolean} [printResult] - 控制台打印返回结果
 * @returns {Promise<Object>} translationData - 返回翻译数据JSON对象
 * @typedef {Object} translationData
 * @property {number} code - http状态码
 * @property {string} data - 翻译结果
 * @property {number} id
 * @property {string} method - 请求的接口类型 目前只有Free
 * @property {string} source_lang - 源语言国家/地区代号
 * @property {string} target_lang - 目标语言国家/地区代号
 * @property {Array<string>} alternatives - 备选翻译列表
 */
async function translate(
  text = 'Error: The original text cannot be empty!',
  sourceLang = 'AUTO',
  targetLang = 'ZH',
  alternativeCount = 0,
  printResult = false,
) {
  const iCount = getICount(text);
  const id = getRandomNumber();

  alternativeCount = Math.max(Math.min(3, alternativeCount), 0);

  const postData = {
    jsonrpc: '2.0',
    method: 'LMT_handle_texts',
    id: id,
    params: {
      texts: [{ text: text, requestAlternatives: alternativeCount }],
      splitting: 'newlines',
      lang: {
        source_lang_user_selected: sourceLang.toUpperCase(),
        target_lang: targetLang.toUpperCase(),
      },
      timestamp: getTimestamp(iCount),
    },
  };

  let postDataStr = JSON.stringify(postData);

  if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
    postDataStr = postDataStr.replace('"method":"', '"method" : "');
  } else {
    postDataStr = postDataStr.replace('"method":"', '"method": "');
  }

  try {
    const response = await axios.post(DEEPL_BASE_URL, postDataStr, {
      headers: headers,
    });

    if (response.status === 429) {
      throw new Error(`Too many requests, your IP has been blocked by DeepL temporarily, please don't request it frequently in a short time.`);
    }

    if (response.status !== 200) {
      console.error('Error', response.status);
      return;
    }

    const result = {
      text: response.data.result.texts[0].text,
      alternatives: response.data.result.texts[0].alternatives.map(alternative => alternative.text)
    };
    if (printResult) {
      console.log(result+'\n');
    }
    return result;
  } catch (err) {
    console.error(err, err.stack);
  }
}

export { translate };
