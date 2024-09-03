// translate.ts
const DEEPL_BASE_URL = 'https://www2.deepl.com/jsonrpc';

const headers = new Headers({
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
});

function getICount(translateText: string): number {
  return (translateText || '').split('i').length - 1;
}

function getRandomNumber(): number {
  return Math.floor(Math.random() * (8399998 - 8300000 + 1) + 8300000) * 1000;
}

function getTimestamp(iCount: number): number {
  const ts = Date.now();
  if (iCount === 0) {
    return ts;
  }
  iCount++;
  return ts - (ts % iCount) + iCount;
}

export async function translate(
  text: string,
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
    const response = await fetch(DEEPL_BASE_URL, {
      method: 'POST',
      headers: headers,
      body: postDataStr,
    });

    if (response.status === 429) {
      throw new Error(
        `Too many requests, your IP has been blocked by DeepL temporarily, please don't request it frequently in a short time.`
      );
    }

    if (response.status !== 200) {
      console.error('Error', response.status);
      return;
    }

    const result = await response.json();
    const data = {
      text: result.result.texts[0].text,
      alternatives: result.result.texts[0].alternatives.map((alternative: any) => alternative.text),
    };

    if (printResult) {
      console.log(data);
    }
    return data;
  } catch (err) {
    console.error(err);
  }
}
