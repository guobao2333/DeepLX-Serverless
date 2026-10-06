# DeepLX Serverless

<p align="center">
<a href="https://github.com/guobao2333/DeepLX-Serverless"><img alt="Repository" src="https://img.shields.io/badge/Github-%230A0A0A.svg?&style=flat-square&logo=Github&logoColor=white"/></a>
</p>

DeepLX Serverless是一个基于DeepL网页版且无需令牌的nodejs项目，与原项目[DeepLX](https://github.com/OwO-Network/DeepLX)(golang)的区别在于**利用了无服务器函数(边缘函数)请求IP不固定的特性**，有效避免了`Error 429`（不过嘛凡事总有例外¯\\\_(ツ)_/¯）

**3.0版本开始完全基于[OwO-Network/DeepLX](https://github.com/OwO-Network/DeepLX)及DeepL网页版数据进行重写。**  
**2.0及之前版本在[LegendLeo/deeplx-serverless](https://github.com/LegendLeo/deeplx-serverless)的基础上进行重构。**

## Prerequisites | 准备工作
- 支持 `Nodejs ≥18` 或 `Docker` 或 `Serverless Function` 的服务器/设备
- (可选) 拥有[Vercel](https://vercel.com)的账号

### Deploy | 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/guobao2333/DeepLX-Serverless)

```bash
git clone https://github.com/guobao2333/DeepLX-Serverless
cd DeepLX-Serverless
npm i
npm run start && npm run test:post
```

配置可编辑`.env`或者提供启动参数来修改。

### Docker | 容器部署

🐳预构建：
```bash
docker run -d -p 6119:6119 ghcr.io/guobao2333/deeplx-serverless
```

自行构建：
```bash
docker build -t deeplxs .
docker run -d -p 6119:6119 deeplxs
```

### Startup Parameters | 启动参数
> [!IMPORTANT]
> 此功能在 2.0.0 及以上版本中可用。  
> 启动参数会覆盖`.env`

有时你可能想在启动服务时添加参数。  
比如添加一个`-c`参数来允许所有跨域请求：
```bash
npm run start -- -c
```

💡使用`-h`来获取所有参数。

## How To Use | 如何使用

* 详细调用参数请查看[项目Wiki](https://github.com/guobao2333/DeepLX-Serverless/wiki)。

### Http Call | 网络请求

```bash
curl -X POST 'http://localhost:6119/translate' -H 'Content-Type: application/json' -d '{"text": "你好，世界！", "source_lang": "zh", "target_lang": "en"}'
```

### Internal Call | 集成使用

运行`npm test`来测试翻译接口。还可以集成到你的项目中来使用DeepL翻译服务。

简单的示例：
```javascript
import { translate } from './src/translate.js';
translate('how are you?', 'en', 'zh', false)
.then(result => {
  console.log(result)
});
```

## Star History | 收藏趋势

<a href="https://star-history.com/#guobao2333/DeepLX-Serverless&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=guobao2333/DeepLX-Serverless&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=guobao2333/DeepLX-Serverless&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=guobao2333/DeepLX-Serverless&type=Date" />
 </picture>
</a>

## Contribute | 贡献
1. 获取`dev`或`main`分支的代码
2. 提交你的更改并描述提交内容
3. 创建一个`Pull Requests`

如果你是第一次贡献，那么请查看[《如何为开源做贡献》](https://opensource.guide/how-to-contribute/)

## Thanks | 感谢

它们是本项目的根本，没有它们就没有本项目。

1. [OwO-Network/DeepLX](https://github.com/OwO-Network/DeepLX)
2. [LegendLeo/deeplx-serverless](https://github.com/LegendLeo/deeplx-serverless)
3. [bropines/Deeplx-vercel](https://github.com/bropines/Deeplx-vercel)

## Disclaimer | 免责声明
**本项目并非DeepL官方产品，亦与其无任何从属关系**。请勿依赖本项目，由于基于DeepL网页版开发，因接口及协议变动可能随时罢工。如果您有大量内容需要翻译，请购买DeepL官方翻译API，DeepLXS始终受到DeepL网页版政策限制。
