# DeepLX Serverless
[本项目](https://github.com/guobao2333/DeepLX-Serverless)是一个基于 DeepL翻译API 的无服务器函数部署项目，旨在提供一个可直接对接的免费翻译解决方案，很适合需要在无服务器环境中集成DeepL翻译服务的开发者使用。

与原项目[DeepLX](https://github.com/OwO-Network/DeepLX)的区别在于**利用了无服务器函数(边缘函数)请求IP不固定的特性**，有效避免了`Error 429`请求太频繁的报错（不过嘛凡事总有例外¯\\\_(ツ)_/¯）

虽然因此不会立马被*暂时封禁*，但也请不要滥用！目前我部署在vercel上会有流量限制，如果您有大量内容需要翻译，请购买DeepL的付费服务，当前项目使用的Free接口会受到DeepL政策限制  
由于目前项目未对Pro接口进行适配，所以现在还只能使用Free接口，不过在将来会完善，敬请期待~ (:


**如果本项目对你有用的话，不妨点个`Star`❤️**  
**Click `Star` if you like!! thanks❤️**

## Prerequisites | 你需要准备什么
在正式开始使用前，我们还需要做一些准备工作喵(^o^)/  
你需要：
- 支持 `Nodejs ≥18` 或 `Docker` 或 `Serverless Function` 的服务器
- (可选) 拥有[Vercel](https://vercel.com)<!-- 或[Netlify](https://netlify.com) -->的账号

> [!IMPORTANT]
> 目前暂不支持类似于`netlify`、`Deno`等平台，虽然deno已在进行对node项目的迁移和兼容层进行开发，但短时间内本项目无法对后续是否支持此类平台做出保证。

## Deploy | 部署

使用任意支持无服务器函数部署的服务器，比如可以使用 `Vercel` 进行部署，又或者其他能够使用nodejs的服务器。(大多数服务器提供商都提供函数计算服务器)  

如果你拥有 [Vercel](https://vercel.com) 账号的话那就很简单了，因为你只需要点击下方按钮即可一键部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/guobao2333/DeepLX-Serverless)

因维护者我有多个仓库需要维护，短时间内将无法对多平台部署方案进行兼容，您可以打开一个`Issues`或打开一个`PR`贡献您的代码。

项目当前没有任何需要填写的变量值，你可以直接使用。  
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

### Common | 一般部署

```bash
git clone https://github.com/guobao2333/DeepLX-Serverless
cd DeepLX-Serverless
npm i
npm run start
```

### Startup Parameters | 启动参数
> [!IMPORTANT]
> 此功能在 2.0.0 及以上版本中可用。
> 启动参数会覆盖`.env`环境变量的定义！

有时你可能想在启动服务时添加参数。  
比如添加一个`--no`前缀和`-a`参数来禁止备选翻译：
```bash
npm run start -- --no-a
```

💡使用`-h`来获取所有参数。

## How To Use | 如何使用
> [!NOTE]
> 请求时视部署服务的地区而定，可能会存在返回速度不一的情况，在中国地区可能会出现完全无法访问的情况，届时请尝试更换部署服务的地区，或让您部署的服务能够正常向DeepL发送请求即可。

运行**本地测试：**
```bash
curl -X POST 'http://localhost:6119/translate' -H 'Content-Type: application/json' -d '{"text": "你好，世界！", "source_lang": "zh", "target_lang": "en"}'
```

在本项目的wiki中详细API文档：  
[English](https://github.com/guobao2333/DeepLX-Serverless/wiki/API-Parameters) | [简体中文](https://github.com/guobao2333/DeepLX-Serverless/wiki/API-%E5%8F%82%E6%95%B0)

部署完成后，可以搭配浏览器插件「沉浸式翻译」一同使用。

### Non-Http Call And Example | 测试运行与集成调用

可以不启动服务运行`npm test`来测试翻译接口。而且还可以集成到你的项目中来使用DeepL翻译服务。

一个简单的示例：
```javascript
import { translate } from './translate.js';
translate('你好，世界！', 'zh', 'en', 3)
.then(result => {
  console.log(result)
});
```

示例仅返回翻译内容，获取请求相关结果仍需使用`POST`
> 如果对此有更好的建议，欢迎打开一个`Issues`

具体请查看`test.js`，其中对方法参数有详细说明。

## Use In Browser Extension Plugin | 在沉浸式翻译中使用

1. 在浏览器上安装最新的 [沉浸式翻译](https://github.com/immersive-translate/immersive-translate/releases)。
2. 点击左下角的 "开发者设置"。启用测试版实验功能。
3. 翻译服务选中 `DeepLX(beta)` 不是DeepL！！
4. 设置 URL 为刚才获取的访问路径（需带translate）。

![沉浸式翻译](https://github.com/LegendLeo/deeplx-serverless/assets/25115173/d3affe2b-9e99-4d5c-bc8c-cd67e70d0368)

## Star History | 收藏趋势

<a href="https://star-history.com/#guobao2333/DeepLX-Serverless&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=guobao2333/DeepLX-Serverless&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=guobao2333/DeepLX-Serverless&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=guobao2333/DeepLX-Serverless&type=Date" />
 </picture>
</a>

## Contribute | 贡献
> [!IMPORTANT]
> **如果您想要做出贡献，可以按照常见顺序操作：**
1. 先切换到`dev`分支，`pull`或者`fork`最新的代码。
2. 提交并***签名***你的更改。(并不强制要求签名，但最好进行签名)
3. 打开一个PR并或多或少说明变化内容，接下来请等待合并。

本人因各种各样的原因，可能无法及时对您的贡献进行测试，所以您可能还需要更多的**自行测试**。

如果你是第一次贡献，并且真的想贡献点什么，那么请查看[《如何为开源做贡献》](https://opensource.guide/how-to-contribute/)，我喜欢叫它「开源贡献指南」，那里有你需要知道的一切。

## License | 开源许可
本项目遵循[GNU/AGPLv3](./LICENSE)许可证的条款发布。

    Copyright (C) 2024 shiguobaona

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

## thanks | 鸣谢

这些项目为本项目的发展提供了很大的帮助。

1. [OwO-Network/DeepLX](https://github.com/OwO-Network/DeepLX)
2. [LegendLeo/deeplx-serverless](https://github.com/LegendLeo/deeplx-serverless)
3. [bropines/Deeplx-vercel](https://github.com/bropines/Deeplx-vercel)
