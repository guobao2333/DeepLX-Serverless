// 由于代码已重构，此实现暂时停用，部分旧实现将会陆续合并到新的实现，以确保向前兼容

import axios from 'axios';
import { brotliDecompress } from 'zlib';

const DEEPL_BASE_URL = 'https://www2.deepl.com/jsonrpc'/*,
  DEEPL_PRO_URL = 'https://api.deepl.com',
  DEEPL_FREE_URL = 'https://api-free.deepl.com'*/;
const headers = {
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7,zh-HK;q=0.6,zh;q=0.5",
  "Authorization": "None",
  "Cache-Control": "no-cache",
  "Content-Type": "application/json",
  "DNT": "1",
  "Origin": "chrome-extension://cofdbpoegempjloogbagkncekinflcnj",
  "Pragma": "no-cache",
  "Priority": "u=1, i",
  "Referer": "https://www.deepl.com/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "none",
  "Sec-GPC": "1",
  "User-Agent": "DeepLBrowserExtension/1.28.0 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
};

function getICount(translateText) {
  return (translateText || '').split('i').length - 1;
}

function getRandomInt(min=8300000, max=8399998) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
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
 * 你可以在其他js中调用，无需运行 'npm start'
 * 如果无需在控制台打印，最后一个布尔值参数可以去掉
 *
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
 * @example
 * await translate('你好，世界！', 'zh', 'en', 3, true);
 */
async function translate(
  text,
  sourceLang,
  targetLang,
  alternativeCount = 0,
  printResult = false,
) {
  const iCount = getICount(text),
    id = getRandomInt();

  alternativeCount = Math.max(Math.min(3, alternativeCount), 0);

  let postData = {
    jsonrpc: "2.0",
    method: "LMT_split_text",
    params: {
      texts: [text],
      commonJobParams: {
        mode: "translate",
        textType: "plaintext"
      },
      lang: { lang_user_selected: "auto" }
    },
    id: id
  };

  postData = JSON.stringify(postData);
  if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
    postData = postData.replace('"method":"', '"method" : "');
  } else {
    postData = postData.replace('"method":"', '"method": "');
  }

  try {
    const response = await axios.post(DEEPL_BASE_URL + '?method=LMT_split_text', postData, {
      headers: headers,
    });

    if (response.status === 429) {
      throw new Error('Too many requests, your IP has been blocked by DeepL temporarily, please don\'t request it frequently in a short time.');
    }

    if (response.status !== 200) {
      throw new Error(`Error code: ${response.status}\nError message: ${response.statusText}`);
    }

    // console.log(response.data);

    const result = {
      detected_source_language: sourceLang.toUpperCase(),
      data: response.data.result.texts[0].chunks[0].sentences[0].text,
      // alternatives: response.data.result.texts[0].alternatives.map(alternative => alternative.text),
      method: "Free"
    };
    if(printResult) console.log(result);
    return result;
  } catch (err) {
    console.error(err, err.stack);
    throw err;
  }
}

export { translate };
