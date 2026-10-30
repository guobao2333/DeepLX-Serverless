import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { translate } from './translate.js';

const useColor = process.stdout.isTTY && process.env.NO_COLOR === undefined;
const C = useColor
  ? { reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m'}
  : { reset: '', red: '', green: '', yellow: '', cyan: '', gray: ''};

export function createApp({ corsOrigin = false } = {}) {
  const app = new Hono();

  const honoOrigin = toHonoCors(corsOrigin);
  if (honoOrigin !== undefined) {
    app.use('*', cors({
      origin: honoOrigin,
      allowMethods: ['GET', 'POST'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }));
  }

  function statusColor(s) {
    if (s >= 500) return C.red;
    if (s >= 400) return C.yellow;
    if (s >= 300) return C.cyan;
    return C.green;
  }

  function logLine(level, status, method, path, ms, err) {
    const [tag, color, sink] =
      level === 'ERROR' ? ['ERROR', C.red, console.error] :
      level === 'WARN' ? ['WARN', C.yellow, console.warn] : ['INFO', C.green, console.log];
    const sColor = statusColor(status);
    const msColor = ms >= 2000 ? C.red : ms >= 1000 ? C.yellow : C.green;
    const errPart = err ? `${C.red}${err.message}${C.reset}` : '';
    let out = `${color}[${tag}]${C.reset} ${C.gray}${new Date().toISOString()}${C.reset} ` +
      `| ${C.cyan}${method}${C.reset} ${path} | ${sColor}${status}${C.reset} ${errPart} | ${msColor}${ms}ms${C.reset}`;

    if (err) {
    if (err.expose) {
      if (err.cause !== undefined) {
        const causeStr = typeof err.cause === 'string'
          ? err.cause
          : (() => { try { return JSON.stringify(err.cause); } catch { return String(err.cause); } })();
        out += `\n  cause: ${causeStr}`;
      }
    } else {
      const stack = (err.stack || String(err)).split('\n').map(l => `  ${l}`).join('\n');
      out += '\n' + stack;
    }}
    sink(out);
  }

  app.use('*', async (c, next) => {
    const t0 = performance.now();
    try {
      await next();
    } catch (err) {
      c.set('err', err);
      c.set('unhandled', true);
      throw err;
    } finally {
      const status = c.get('unhandled') ? 500 : (c.res?.status ?? 500);
      const ms = Math.round(performance.now() - t0);
      const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
      logLine(level, status, c.req.method, c.req.path, ms, c.get('err'));
    }
  });

  app.get('/', (c) => c.json({
    code: 200,
    message: "Welcome to the DeepL Free API. Please POST to '/translate'. " +
             "Visit 'https://github.com/guobao2333/DeepLX-Serverless' for more information."
  }));

  app.post('/translate',
  bodyLimit({
    maxSize: 64 * 1024,
    onError: (c) => c.json({ code: 413, message: 'Payload Too Large' }, 413),
  }),
  async (c) => {
    let body;
    try { body = await c.req.json(); }
    catch { return c.json({ code: 400, message: 'Bad Request' }, 400); }

    if (!body || typeof body !== 'object') {
      return c.json({ code: 400, message: 'Bad Request' }, 400);
    }

    let { text, source_lang, target_lang } = body;
    if (typeof text !== 'string' || !text.trim() ||
        (source_lang != null && typeof source_lang !== 'string') ||
        typeof target_lang !== 'string') {
      return c.json({ code: 400, message: 'Bad Request' }, 400);
    }

    try {
      const DEBUG = process.env.DEBUG_TRANSLATE === '1';
      const result = await translate(text, source_lang, target_lang, DEBUG);

      if (result.code === 400) return c.json(result, 400);
      if (result.code === 429) {
        if (result.retry_after) {
          c.header('Retry-After', result.retry_after);
        }
        return c.json(result, 429);
      }
      if (!result || !result.data) {
        return c.json({ code: 500, message: 'Translation failed', error: result?.message }, 500);
      }

      return c.json({
        code: result.code,
        id: result.id,
        data: result.data,
        method: result.method,
        source_lang: result.source_lang,
        target_lang: result.target_lang,
        alternatives: result.alternatives ?? [],
      });
    } catch (err) {
      c.set('err', err);
      if (err.name === 'TranslateError' && err.code === 'ETIMEDOUT') {
        return c.json({ code: 504, message: 'Upstream request timeout' }, 504);
      }
      if (err.name === 'TranslateError') {
        return c.json({ code: 502, message: 'Upstream unreachable' }, 502);
      }
      if (err.name === 'UpstreamError') {
        return c.json({
          code: 502,
          message: err.expose ? err.message : 'Upstream rejected the request',
        }, 502);
      }
      return c.json({ code: 500, message: 'Internal Server Error' }, 500);
    }
  });

  app.notFound((c) => c.json({ code: 404, message: 'Not Found' }, 404));
  app.onError((err, c) => {
    c.set('err', err);
    return c.json({ code: 500, message: 'Internal Server Error' }, 500);
  });

  return app;
}


export function checkPort(arg) {
    if (typeof arg === 'number' && !isNaN(arg) && Number.isInteger(arg) && arg >= 0 && arg <= 65535) return arg;
    console.warn(`${C.yellow}WARNING:${C.reset} port should be a number >= 0 and < 65536.\nUsed default value instead: 6119\n`);
    return 6119;
}

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
export function checkCors(arg) {
  if (arg === true || arg === false) return arg;
  if (arg instanceof RegExp || Array.isArray(arg)) return arg;
  if (arg == null) return false;

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
      let err =`ParamTypeError: invalid regex '${s}': ${e.message}`
      console.error(err);
      throw new Error(err);
    }
  }

  if (s.includes(',')) {
    return s.split(',').map(x => x.trim()).filter(Boolean);
  }

  return s;
}

/**
 * 把 Express 风格的 origin（boolean | string | RegExp | Array）
 * 适配成 Hono cors 的 origin（string | function | undefined）
 */
function toHonoCors(parsed) {
  if (parsed === false || parsed == null) return undefined;
  if (parsed === true) return (origin) => origin;
  if (parsed === '*') return '*';
  if (typeof parsed === 'string') return parsed;
  if (Array.isArray(parsed)) {
    return (origin) => parsed.includes(origin) ? origin : undefined;
  }
  if (parsed instanceof RegExp) {
    const re = new RegExp(parsed.source, parsed.flags.replace(/[gy]/g, ''));
    return (origin) => re.test(origin) ? origin : undefined;
  }
  return undefined;
}
