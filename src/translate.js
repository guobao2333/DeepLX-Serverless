import axios from 'axios';
import { brotliDecompress } from 'zlib';

const baseURL = 'https://www2.deepl.com',
  proURL = 'https://api.deepl.com',
  freeURL = 'https://api-free.deepl.com';

function formatPostString(postData) {
  let body = JSON.stringify(postData),
      str = ((body.id + 5) % 29 === 0 || (body.id + 3) % 13 === 0) ? '"method" : "' : '"method": "';
  body = body.replace('"method":"', str);
  // console.log(body);
  return body;
}

async function sendRequest(postData, urlMethod, dlSession, tagHandling, printResult) {
  const urlFull = `${baseURL}/jsonrpc?`;

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'DeepLBrowserExtension/1.28.0 Mozilla/5.0',
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    Origin: 'https://www.deepl.com',
    Referer: 'https://www.deepl.com/',
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    ...(dlSession && {'Cookie': `dl_session=${dlSession}`})
  };
  postData = formatPostString(postData);
  // console.warn(postData);

  try {
    const response = await axios.post(urlFull, postData, {
      headers: headers
    });
  
    if (response.headers['content-encoding'] === 'br') {
      const decompressed = await new Promise((resolve, reject) => {
        brotliDecompress(response.data, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
      return JSON.parse(decompressed.toString());
    }
    return response.data;
  } catch (err) {
    if (err.response.status === 429) {
      return {
        code: err.response.status,
        message: 'Too Many Requests'
      };
    } else { 
      console.error(`[ERROR] sendRequest: ${err.message}`);
      throw err;
    }
  }
}

async function splitText(text, tagHandling, dlSession, printResult) {
  const postData = {
    jsonrpc: '2.0',
    method: 'LMT_split_text',
    id: Math.floor(Math.random() * 1000000),
    params: {
      commonJobParams: { mode: 'translate' },
      lang: { lang_user_selected: 'auto' },
      texts: [text],
      textType: tagHandling ? 'richtext' : 'plaintext'
    }
  };

  try {
    return await sendRequest(postData, 'LMT_split_text', dlSession, printResult);
  } catch (err) {
    console.error("[ERROR] splitText:", err);
    throw new Error(`splitText failed: ${err.message || err}`); 
  }
}

// 执行翻译任务
async function translate(text, sourceLang, targetLang, dlSession, tagHandling, printResult) {
  try {
  if (!text) {
    throw new Error('No text to translate');
  }

  // 分割文本
  const splitResult = await splitText(text, tagHandling === 'html' || tagHandling === 'xml', dlSession, printResult);
  // console.warn(splitResult);
  
  if (splitResult.code === 429) {
    return {
      code: splitResult.code,
      message: splitResult.message
    }
  }

  // 获取检测到的语言
  if (sourceLang === 'auto' || sourceLang === '') {
    sourceLang = splitResult.result.lang.detected.toLowerCase();
  }

  // 准备翻译任务
  const chunks = splitResult.result.texts[0].chunks,
  jobs = chunks.map((chunk, index) => {
    const sentence = chunk.sentences[0],
    contextBefore = index > 0 ? [chunks[index - 1].sentences[0].text] : [],
    contextAfter = index < chunks.length - 1 ? [chunks[index + 1].sentences[0].text] : [];

    return {
      kind: 'default',
      preferred_num_beams: 4,
      raw_en_context_before: contextBefore,
      raw_en_context_after: contextAfter,
      sentences: [{
        prefix: sentence.prefix,
        text: sentence.text,
        id: index + 1
      }]
    };
  });

  const hasRegionalVariant = targetLang.includes('-'),
        targetLangCode = hasRegionalVariant ? targetLang.split('-')[0] : targetLang;

  const postData = {
    jsonrpc: '2.0',
    method: 'LMT_handle_jobs',
    id: Math.floor(Math.random() * 1000000), // 随机ID
    params: {
      commonJobParams: {
        mode: 'translate',
        ...(hasRegionalVariant && { regional_variant: targetLang })
      },
      lang: {
        source_lang_computed: sourceLang.toUpperCase(),
        target_lang: targetLangCode.toUpperCase()
      },
      // jobs: [{kind:"default",sentences:[{text:text,id:1,prefix:""}],raw_en_context_before:[],raw_en_context_after:[],preferred_num_beams:1}],
      jobs: jobs,
      priority: 1,
      timestamp: Date.now()
    }
  };

  const response = await sendRequest(postData, 'LMT_handle_jobs', dlSession, printResult);

  let alternatives = [], translatedText = '';

  // 获取备选翻译
  if (response.result.translations.length > 0) {
    response.result.translations[0].beams.forEach(beam => {
      alternatives.push(beam.sentences[0].text);
    });
  }
  // 获取翻译
  translatedText = response.result.translations[0].beams[0].sentences[0].text;
  alternatives.shift();

  if (!translatedText) {
    console.log(JSON.stringify(response));
    throw new Error('Translation failed');
  }

  const ret = {
    code: postData.status || 200,
    id: postData.id,
    method: "Free",
    data: translatedText,
    source_lang: sourceLang.toUpperCase(),
    target_lang: targetLang.toUpperCase(),
    alternatives: alternatives
  }
  if(printResult) console.log(response);
  if(printResult) console.log(ret);
  return ret;
  } catch (err) {
    console.error("[ERROR] translate:", err);
    throw new Error(err.message || err);
  }
}

export { translate };