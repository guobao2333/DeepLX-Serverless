import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { createApp, checkCors, resolvePort, makeColors } from './app.js';
import pkg from '../package.json' with { type: 'json' };

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  let values;
  try {
  ({ values } = parseArgs({
    options: {
      port: { type: 'string', short: 'p' },
      cors: { type: 'string', short: 'c' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  }));
  } catch (err) {
    console.error(`Invalid arguments: ${err.message}`);
    console.error('Run with -h for usage.');
    process.exit(1);
  }

  if (values.help || values.version) {
    if (values.help) console.log(
      ['\nUsage: <runtime> src/server.js [options]',
        '\nOptions:',
        '  -p, --port <PORT>     Port to listen on (default: 6119; 0 = random)',
        '  -c, --cors <ORIGIN>   CORS origin(s); comma-separated or /regex/',
        '  -v, --version         Print version',
        '  -h, --help            Print this help info',
        '\nEnv:',
        '  PORT, CORS_ORIGIN     Defaults for -p and -c',
      ].join('\n'));
    if (values.version) console.log(`\n\x1b[90m${pkg.name}@\x1b[35m${pkg.version}\x1b[0m`);
    process.exit(0);
  }

  const useColor = (process.stdout.isTTY ?? false) && process.env.NO_COLOR === undefined;
  const color = makeColors(useColor);

  let port = String(values.port ?? process.env.PORT ?? '').trim();
  port = resolvePort(port === '' ? 6119 : Number(port), color);
  const corsOrigin = checkCors(values.cors ?? process.env.CORS_ORIGIN ?? false);

  const debugPrint = process.env.DEBUG_PRINT === '1';
  const rateLimit = process.env.RATE_LIMIT_MAX
    ? {
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
        max: Number(process.env.RATE_LIMIT_MAX),
      }
    : null;

  const app = createApp({ corsOrigin, useColor, debugPrint, rateLimit });

  // 环境运行时判断
  if (typeof Bun !== 'undefined') {
    const server = Bun.serve({ port, fetch: app.fetch });
    const actualPort = server.port;
    const shutdown = async () => { await server.stop(); process.exit(0); };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    console.log(`\x1b[32m[Bun]\x1b[0m listening on \x1b[35mhttp://localhost:${actualPort}\x1b[0m`);

  } else if (typeof Deno !== 'undefined') {
    const server = Deno.serve({ port }, app.fetch);
    const actualPort = server.addr.port;
    const shutdown = async () => { await server.shutdown(); Deno.exit(0); };
    Deno.addSignalListener('SIGTERM', shutdown);
    Deno.addSignalListener('SIGINT', shutdown);
    console.log(`\x1b[32m[Deno]\x1b[0m listening on \x1b[35mhttp://localhost:${actualPort}\x1b[0m`);

  } else {
    const { serve } = await import('@hono/node-server');
    const server = serve({ port, fetch: app.fetch }, (info) => {
      console.log(`\x1b[32m[Node]\x1b[0m listening on \x1b[35mhttp://localhost:${info.port}\x1b[0m`);
    });
    const shutdown = async () => server.close(() => process.exit(0));
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}

export { createApp };
