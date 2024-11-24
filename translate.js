import axios from 'axios';
import lodash from 'lodash';
import { brotliDecompress } from 'zlib';


const DEEPL_BASE_URL = 'https://www2.deepl.com/jsonrpc'/*,
  DEEPL_PRO_URL = 'https://api.deepl.com',
  DEEPL_FREE_URL = 'https://api-free.deepl.com'*/;
const headers = {
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7,zh-HK;q=0.6,zh;q=0.5',
  'Authorization': 'None',
  'Cache-Control': 'no-cache',
  'Content-Type': 'application/json',
  'DNT': '1',
  'Origin': 'chrome-extension://cofdbpoegempjloogbagkncekinflcnj',
  'Pragma': 'no-cache',
  'Priority': 'u=1, i',
  'Referer': 'https://www.deepl.com/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'none',
  'Sec-GPC': '1',
  'User-Agent': 'DeepLBrowserExtension/1.28.0 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
};

function getICount(translateText) {
  return (translateText || '').split('i').length - 1;
}

function getRandomNumber() {
  return lodash.random(8300000, 8399998) * 1000;
}

function getTimestamp(iCount) {
  const ts = Date.now();
  if (iCount === 0) {
    return ts;
  }
  iCount++;
  return ts - (ts % iCount) + iCount;
}

async function translate(
  text,
  sourceLang,
  targetLang,
  alternativeCount = 0,
  printResult = false,
) {
  const iCount = getICount(text);
  const id = getRandomNumber();

  alternativeCount = Math.max(Math.min(3, alternativeCount), 0);

  const postData = {
    jsonrpc: '2.0',
    method: 'LMT_split_text',
    params: {
      texts: [text],
      commonJobParams: {
        mode: 'translate',
        textType: 'plaintext'
      },
      lang: {
        lang_user_selected: sourceLang.toUpperCase(),
        lang_computed: targetLang.toUpperCase()
      }/*,
      timestamp: getTimestamp(iCount)*/
    },
    id: id
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
      throw new Error('Too many requests, your IP has been blocked by DeepL temporarily, please don\'t request it frequently in a short time.');
    }

    if (response.status !== 200) {
      throw new Error(`Error code: ${response.status}\nError message: ${response.statusText}`);
    }

    console.log(response.data);

    const result = {
      detected_source_language: sourceLang.toUpperCase(),
      data: response.data.result.texts[0].chunks[0].sentences[0].text,
      alternatives: response.data.result.texts[0].alternatives.map(alternative => alternative.text),
      method: "Free"
    };
    if(printResult) console.log(result+'\n');
    return result;
  } catch (err) {
    console.error(err, err.stack);
  }
}

export { translate };
