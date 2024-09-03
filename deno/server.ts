import { Application, Router, Context } from "https://deno.land/x/oak/mod.ts";
import { translate } from "./translate.ts";

// 读取配置文件
const configText = await Deno.readTextFile("config.json");
const config = JSON.parse(configText);
const PORT = 9000;
const allowAlternative = true;

// 验证令牌中间件
async function authenticateToken(ctx: Context, next: () => Promise<void>) {
  const token = ctx.request.url.searchParams.get("token");
  if (token && token === config.apiToken) {
    await next();
  } else {
    ctx.response.status = 403;
    ctx.response.body = {
      code: 403,
      message: 'Forbidden: Invalid token',
    };
  }
}

// 创建应用和路由
const app = new Application();
const router = new Router();

// 添加路由到路由器
router
  .post('/translate', authenticateToken, async (ctx) => {
    const startTime = Date.now(); // 记录开始时间

    // 检查请求体
    const body = await ctx.request.body().value;

    if (!body || !body.text) {
      const duration = Date.now() - startTime;
      console.log(`[LOG] ${new Date().toISOString()} | 404 | ${duration}ms | POST "translate"`);
      ctx.response.status = 404;
      ctx.response.body = {
        code: 404,
        message: "Path not found",
      };
      return;
    }

    // 判断是否备选翻译
    if (!allowAlternative) body.alt_count = 0;
    const { text, source_lang, target_lang, alt_count } = body;

    try {
      const result = await translate(text, source_lang, target_lang, alt_count);
      const duration = Date.now() - startTime;
      console.log(`[LOG] ${new Date().toISOString()} | 200 | ${duration}ms | POST "translate"`);

      ctx.response.body = {
        code: 200,
        data: result.text, // 取第一个翻译结果
        id: Math.floor(Math.random() * 10000000000), // 生成一个随机 ID
        method: 'Free',
        source_lang,
        target_lang,
        alternatives: result.alternatives,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[ERROR] ${new Date().toISOString()} | 500 | ${duration}ms | POST "translate" | ${error.message}`);
      ctx.response.status = 500;
      ctx.response.body = {
        code: 500,
        message: 'Translation failed',
        error: error.message,
      };
    }
  })
  .get('/', authenticateToken, (ctx) => {
    ctx.response.body = {
      code: 200,
      message: "Welcome to the DeepL Free API. Please POST to '/translate'. Visit 'https://github.com/OwO-Network/DeepLX' and 'https://github.com/guobao2333/DeepLX-Serverless' for more information.",
    };
  });

// 将路由添加到应用
app.use(router.routes());
app.use(router.allowedMethods());

// 启动应用
await app.listen({ port: PORT });
