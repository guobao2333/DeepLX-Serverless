import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { translate } from './translate.js';

const app = express(),
  PORT = 9000,
  allowAlternative = true,
  CORS = {
    origin: false, // 默认关闭跨域访问，还支持指定多个域名或正则表达式
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type',
    preflightContinue: false
  };

// 其他平台支持配置CORS，我就不兼容了
app.use(cors(CORS));
app.use(bodyParser.json());

// 为了方便兼容多平台才这样写
app.post('/translate', async (req, res) => await post(req, res));
app.get('/', async (req, res) => await get(req, res));

async function post(req, res) {
  const startTime = Date.now(); // 记录开始时间

  // 检查请求方法和请求体
  if (req.method !== 'POST' || !req.body || !req.body.text) {
    const duration = Date.now() - startTime;
    console.log(`[LOG] ${new Date().toISOString()} | 404 | ${duration}ms | POST "translate"`);
    return res.status(404).json({
      "code": 404,
      "message": "Path not found"
    });
  }

  // 是否允许备选翻译
  if (!allowAlternative) alt_count = 0;
  const { text, source_lang, target_lang, alt_count } = req.body;

  try {
    const result = await translate(text, source_lang, target_lang, alt_count);
    const duration = Date.now() - startTime; // 计算处理时间
    console.log(`[LOG] ${new Date().toISOString()} | 200 | ${duration}ms | POST "translate"`);

    const responseData = {
      code: 200,
      data: result.text, // 取第一个翻译结果
      id: Math.floor(Math.random() * 10000000000), // 生成一个随机 ID
      method: 'Free',
      source_lang,
      target_lang,
      alternatives: result.alternatives
    };

    res.json(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ERROR] ${new Date().toISOString()} | 500 | ${duration}ms | POST "translate" | ${error.message}`);
    res.status(500).json({
      code: 500,
      message: 'Translation failed',
      error: error.message
    });
  }
};

async function get(req, res) {
  res.json({
    code: 200,
    message: "Welcome to the DeepL Free API. Please POST to '/translate'. This program is published in accordance with the terms of GNU/AGPLv3. Visit 'https://github.com/guobao2333/DeepLX-Serverless' for more information."
  });
};

// 启动本地服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export { post, get };