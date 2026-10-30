import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { createApp, checkCors, checkPort } from './app.js';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  let values;
  try {
  ({ values } = parseArgs({
    options: {
      port: { type: 'string', short: 'p' },
      cors: { type: 'string', short: 'c' },
      help: { type: 'boolean', short: 'h' },
    },
  }));
  } catch (err) {
    console.error(`Invalid arguments: ${err.message}`);
    console.error('Run with -h for usage.');
    process.exit(1);
  }

  if (values.help) {
    console.log('Usage: <runtime> src/server.js [-p PORT] [-c CORS_ORIGIN]');
    process.exit(0);
  }

  const port = checkPort((values.port ?? process.env.PORT) != null && rawPort.trim() !== '' ? Number(rawPort) : 6119);
  const corsOrigin = checkCors(values.cors ?? process.env.CORS_ORIGIN ?? false);
  const app = createApp({ corsOrigin });

  // 环境运行时判断
  if (typeof Bun !== 'undefined') {
    const server = Bun.serve({ port, fetch: app.fetch });
    const actualPort = server.port;
    const shutdown = async () => { await server.stop(); process.exit(0); };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    console.log(`\x1b[32m[Bun]\x1b[0m listening on http://localhost:${actualPort}`);
  
  } else if (typeof Deno !== 'undefined') {
    const server = Deno.serve({ port }, app.fetch);
    const actualPort = server.addr.port;
    const shutdown = async () => { await server.shutdown(); Deno.exit(0); };
    Deno.addSignalListener('SIGTERM', shutdown);
    Deno.addSignalListener('SIGINT', shutdown);
    console.log(`\x1b[32m[Deno]\x1b[0m listening on http://localhost:${actualPort}`);
  
  } else {
    const { serve } = await import('@hono/node-server');
    const server = serve({ port, fetch: app.fetch }, (info) => {
      console.log(`\x1b[32m[Node]\x1b[0m listening on http://localhost:${info.port}`);
    });
    const shutdown = async () => server.close(() => process.exit(0));
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}

export { createApp };
