import express from 'express';
import cors from 'cors';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { translate } from './translate.js';

// 解析参数
const argv = yargs(hideBin(process.argv))
    .option('port', {
        alias: 'p',
        describe: 'Service port number',
        coerce: check_port,
        default: Number(process.env.PORT) || 6119
    })
    .option('cors', {
        alias: 'c',
        describe: 'Allowed CORS origin(s). Supports: true|false|"*"|origin|a.com,b.com|/regex/flags',
        coerce: check_cors,
        default: process.env.CORS_ORIGIN || false
    })
    .help().alias('help', 'h')
    .argv;

// 定义配置
const app = express(),
    PORT = argv.port,
    CORS = {
        origin: check_cors(argv.cors),
        methods: 'GET,POST',
        allowedHeaders: ['Content-Type', 'Authorization'],
        preflightContinue: false
    };

app.use(cors(CORS));
app.use(express.json());

app.post('/translate', async (req, res) => await post(req, res));
app.get('/', async (req, res) => await get(req, res));

async function post(req, res) {
    const startTime = Date.now();

    if (!req.body || typeof req.body !== 'object') {
        const duration = Date.now() - startTime;
        console.log(`[WARN] ${new Date().toISOString()} | POST "translate" | 400 | Bad Request | ${duration}ms`);
        return res.status(400).json({ code: 400, message: 'Bad Request' });
    }

    let { text, source_lang, target_lang } = req.body;
    source_lang = (source_lang || 'auto').toUpperCase();
    target_lang = (target_lang || '').toUpperCase();

    // 检查请求体
    if (!text || !target_lang) {
        const duration = Date.now() - startTime;
        console.log(`[WARN] ${new Date().toISOString()} | POST "translate" | 400 | Bad Request | ${duration}ms`);
        return res.status(400).json({ code: 400, message: 'Bad Request' });
    }

    try {
        const result = await translate(text, source_lang, target_lang);
        const duration = Date.now() - startTime;

        if (result.code === 429) {
            console.error(`[WARN] ${new Date().toISOString()} | POST "translate" | 429 | ${result.message} | ${duration}ms`);
            return res.status(429).json({
                code: 429,
                message: result.message
            });
        }

        if (!result || !result.data) {
            console.error(`[ERROR] ${new Date().toISOString()} | POST "translate" | 500 | Translation failed | ${duration}ms`);
            return res.status(500).json({
                code: 500,
                message: 'Translation failed',
                error: result?.statusText || 'Empty translation'
            });
        }

        console.log(`[LOG] ${new Date().toISOString()} | POST "translate" | 200 | ${duration}ms`);

        return res.json({
            code: result.code,
            id: result.id,
            data: result.data,
            method: 'Free',
            source_lang: result.source_lang,
            target_lang,
            alternatives: []
        });

    } catch (err) {
        const duration = Date.now() - startTime;

        // 上游超时
        if (err.code === 'ETIMEDOUT' ||
            err.name === 'TimeoutError' ||
            err.name === 'AbortError' ||
            /timeout/i.test(err.message || '')) {
            console.error(`[ERROR] ${new Date().toISOString()} | POST "translate" | 504 | ${err.message} | ${duration}ms`);
            return res.status(504).json({
                code: 504,
                message: 'Upstream request timeout'
            });
        }

        // 上游网络不可达
        const NETWORK_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET', 'EAI_AGAIN', 'EPIPE', 'EHOSTUNREACH'];
        if (NETWORK_CODES.includes(err.code) || err.name === 'TypeError' /* fetch failed */) {
            console.error(`[ERROR] ${new Date().toISOString()} | POST "translate" | 502 | ${err.message} | ${duration}ms`);
            return res.status(502).json({
                code: 502,
                message: 'Upstream unreachable'
            });
        }

        // 其他
        console.error(`[ERROR] ${new Date().toISOString()} | POST "translate" | 500 | ${err.message} | ${duration}ms`);
        console.error(err.stack);
        return res.status(500).json({
            code: 500,
            message: err.message
        });
    }
}

async function get(req, res) {
    res.status(200).json({
        code: 200,
        message: "Welcome to the DeepL Free API. Please POST to '/translate'. " +
        "Visit 'https://github.com/guobao2333/DeepLX-Serverless' for more information."
    });
};

/**
 * 解析 CORS origin 参数，支持：
 *   - true / false                  → 原样返回（true 表示反射请求方 origin）
 *   - "*"                           → 通配符
 *   - "https://a.com"               → 单个精确 origin
 *   - "https://a.com,https://b.com" → 数组
 *   - "/^https?:\\/\\/.*\\.x\\.com$/" → RegExp（可带 flags：/.../i）
 *   - RegExp / Array / Boolean      → 已解析过的直接返回
 *
 * @param {string|boolean|RegExp|Array} arg
 * @returns {boolean|string|RegExp|Array}
 */
function check_cors(arg) {
    if (arg === true || arg === false) return arg;
    if (arg instanceof RegExp || Array.isArray(arg)) return arg;

    if (typeof arg !== 'string') {
        console.error(`ParamTypeError: '${arg}', origin should be Boolean, String, RegExp or Array.`);
        process.exit(1);
    }

    const s = arg.trim();
    if (s === '') return false;
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (s === '*') return '*';

    const m = s.match(/^\/(.+)\/([dgimsuvy]*)$/);
    if (m) {
        try {
            return new RegExp(m[1], m[2]);
        } catch (e) {
            console.error(`ParamTypeError: invalid regex '${s}': ${e.message}`);
            process.exit(1);
        }
    }

    if (s.includes(',')) {
        return s.split(',').map(x => x.trim()).filter(Boolean);
    }

    return s;
}

function check_port(arg) {
    if (typeof arg === 'number' && !isNaN(arg) && Number.isInteger(arg) && arg >= 0 && arg <= 65535) return arg;

    console.warn('WARNING:\x1b[0m port should be >= 0 and < 65536.\nUsed default value instead: 6119\n');
    return 6119;
}

// 启动本地服务器
app.listen(PORT, () => {
    console.log(`Server is running and listening on http://localhost:${PORT}/translate`);
});

export { post, get };
