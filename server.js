import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import bodyParser from 'body-parser';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { translate } from './translate.js';

// 解析参数
const argv = yargs(hideBin(process.argv))
  .option('port', {
    alias: 'p',
    describe: '端口号',
    coerce: check_port,
    default: Number(process.env.PORT) || 6119
  })
  .option('alt', {
    alias: 'a',
    describe: '请求备选翻译',
    type: 'boolean',
    default: Boolean(process.env.ALTERNATIVE) || true
  })
  .option('cors', {
    alias: 'c',
    describe: '允许跨域访问的源(origin)',
    coerce: check_cors,
    default: process.env.CORS_ORIGIN || false
  })
  .help().alias('help', 'h')
  .argv;

// 定义配置
const app = express(),
  PORT = argv.port,
  allowAlternative = argv.alt,
  CORS = {
    origin: argv.cors,
    methods: 'GET,POST',
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  // 检查请求体
  if (!req.body || Object.keys(req.body).length === 0) {
    const duration = Date.now() - startTime;
    console.log(`[LOG] ${new Date().toISOString()} | POST "translate" | 400 | Request body does not exist | ${duration}ms`);
    return res.status(400).json({
      "code": 400,
      "message": "Bad Request"
    });
  }

  const { text, source_lang, target_lang, alt_count } = req.body;

  // 是否允许备选翻译
  if (!allowAlternative && alt_count !== undefined) {
    const duration = Date.now() - startTime;
    console.log(`[LOG] ${new Date().toISOString()} | POST "translate" | 405 | Alt Not Allowed | ${duration}ms`);
    return res.status(405).json({
      "code": 405,
      "message": "Alternative Translate Not Allowed"
    });
    alt_count = 0;
  }

  try {
    const result = await translate(text, source_lang, target_lang, alt_count);
    const duration = Date.now() - startTime; // 计算处理时间
    console.log(`[LOG] ${new Date().toISOString()} | POST "translate" | 200 | ${duration}ms`);

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
    console.error(`[ERR] ${new Date().toISOString()} | POST "translate" | 500 | ${error.message} | ${duration}ms`);
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

function check_cors(arg) {
  if (arg === undefined) return;
  if (typeof arg === 'string' || typeof arg === 'boolean') {
    return arg;
  }
  console.error("ParamTypeError: \x1b[33m'"+arg+"'\x1b[31m, origin should be Boolean or String.\n\x1b[0meg: \x1b[32m'*' or true or RegExp");
  process.exit(1);
}

function check_port(arg) {
  if (typeof arg === 'number' && !isNaN(arg) && Number.isInteger(arg) && arg >= 0 && arg <= 65535) {
    return arg;
  }
  console.warn("WARNING:\x1b[0m port should be >= 0 and < 65536.\nUsed default value instead: 6119\n");
  return 6119;
}

// 启动本地服务器
app.listen(PORT, () => {
  console.log(`Server is running and listening on http://localhost:${PORT}`);
});

export { post, get };
