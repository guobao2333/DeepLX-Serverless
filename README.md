# DeepLX Serverless
[本项目](https://github.com/guobao2333/DeepLX-Serverless)是一个基于 DeepL翻译API 的无服务器函数部署项目，旨在提供一个可直接对接的免费翻译解决方案，很适合需要在无服务器环境中集成DeepL翻译服务的开发者使用。

与原项目[DeepLX](https://github.com/OwO-Network/DeepLX)的区别在于**利用了无服务器函数(边缘函数)请求IP不固定的特性**，有效避免了`Error 429`请求太频繁的报错（不过嘛凡事总有例外¯\\\_(ツ)_/¯）

虽然因此不会立马被*暂时封禁*，但也请不要滥用！目前我部署在vercel上会有流量限制，如果您有大量内容需要翻译，请购买DeepL的付费版，当前项目使用的free接口会受到DeepL政策限制  
由于目前项目未对pro接口进行适配，所以现在还只能使用free接口，不过在将来会完善，敬请期待~(„• ֊ •„)੭


**如果本项目对你有用的话，不妨点个`Star`❤️**  
**Click `Star` if you like!! thanks❤️**

<!-- # Let's Go | 开始使用 -->
## Prerequisites | 你需要准备什么
在正式开始使用前，我们还需要做一些准备工作喵(^o^)/  
你需要：
- 一双灵活的小手🙌🏻
- 一个聪明的小脑袋瓜🧠
- 支持 `Nodejs ≥18` 或 `Docker` 或 `Serverless Function` 的服务器💻
- (可选) 拥有[Vercel](https://vercel.com) <!-- 或[Netlify](https://netlify.com) --> 的账号

## Deploy | 部署

使用任意支持无服务器函数部署的服务器，比如可以使用 `Vercel` <!-- 或者 `Netlify` --> 进行部署，又或者其他能够使用nodejs的服务器。(大多数服务器提供商都提供函数计算服务器)  

如果你拥有 [Vercel](https://vercel.com) <!-- 或者 [Netlify](https://netlify.com) --> 账号的话那就很简单了，因为你只需要点击下方按钮即可一键部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/guobao2333/DeepLX-Serverless)
<!-- [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/guobao2333/DeepLX-Serverless) -->

因维护者我有多个仓库需要维护，短时间内将无法对多平台部署方案进行兼容，您可以打开一个`issues📌`或打开一个`Pull Request📎`贡献您的代码。  
✨项目当前没有任何需要填写的变量值，但在后续可能会添加。

### Docker | 容器部署

🐳直接运行预构建容器：
```bash
docker run -d -p 6119:6119 ghcr.io/guobao2333/deeplx-serverless
```

🚧你还可以自己构建后运行：
```bash
docker build -t deeplxs .
docker run -d -p 6119:6119 deeplxs
```


### Self hosting | 源码部署

✅尽管本项目是专为 serverless 适配的方案，但是也能使用自己的服务器直接部署源码：
```bash
git clone https://github.com/guobao2333/DeepLX-Serverless
cd DeepLX-Serverless
npm i
npm run start
```

📋复制到命令行运行来一键启动服务：
```bash
git clone https://github.com/guobao2333/DeepLX-Serverless && cd DeepLX-Serverless && npm i && npm run start
```

如果部署完成了，就可以开始使用啦！🎉

#### startup parameters | 启动参数
> [!IMPORTANT]
> 此功能在 v2.0.0 及以上版本中可用

如果你想的话，可以在启动时添加参数。  
比如添加一个`--no`前缀和`-a`参数来禁止备选翻译：
```bash
npm run start -- --no-a
```

💡使用`-h`来获取所有参数。

## How To Use | 如何使用
> [!IMPORTANT]
> 请求时视部署服务的地区而定，可能会存在返回速度不一的情况，在中国地区可能会出现完全无法访问的情况，届时请尝试更换部署服务的地区，或让您部署的服务能够正常向DeepL发送请求即可。

📡使用post通过 `域名地址` + `/translate` + `json请求体` 这样的形式获取json响应。

❔详细API文档，请查看本项目的wiki：  
[English](https://github.com/guobao2333/DeepLX-Serverless/wiki/API-Parameters) | [简体中文](https://github.com/guobao2333/DeepLX-Serverless/wiki/API-%E5%8F%82%E6%95%B0)

📋你可以直接复制到命令行运行**本地测试：**
```bash
curl --location --request POST 'http://localhost:6119/translate' --header 'Content-Type: application/json' --data '{"text": "你好，世界！", "source_lang": "zh", "target_lang": "en"}'
```

✨部署完成后，建议搭配浏览器插件「沉浸式翻译」一同使用。

### NON-HTTP Call And example | 测试运行与内部调用
🛠️你可以在不启动服务的情况下直接运行`npm test`用来测试翻译接口以及当前网络与DeepL的连通性。  
⚠️注意！测试仅返回翻译内容，获取所有结果需要使用`POST`！

由于本项目并没有只局限于http协议的访问，所以完全可以集成到你的Serverless项目中来使用DeepL，下面是一个简单的调用示例：
```javascript
import { translate } from './translate.js';
translate('你好，世界！', 'zh', 'en', 3)
.then(result => {
  console.log(result)
});
```

具体可以查看`test.js`，其中对调用函数的参数有详细说明。

## Use In Browser Extension Plugin | 在沉浸式翻译中使用

1. 在浏览器上安装最新的 [沉浸式翻译](https://github.com/immersive-translate/immersive-translate/releases)。
2. 点击左下角的 "开发者设置"。启用测试版实验功能。
3. 翻译服务选中 `DeepLX(beta)`
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
> **如果您想要做出贡献，可以按照以下顺序操作：**
1. 先切换到`dev`分支，`pull`或者`fork`最新的代码。
2. 提交并***签名***你的更改。(对提交进行签名可以防止冒名顶替)
3. 打开一个PR或多或少说明更改内容，接下来请等待合并。

本人因时间(和各种各样的)原因，可能无法及时对您的贡献进行测试，所以您可能还需要更多的**自行测试**。

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

## Acknowledgments | 鸣谢

1. [OwO-Network/DeepLX](https://github.com/OwO-Network/DeepLX) - 感谢OwO-Network的优秀项目(•̀ᴗ•́)و̑̑
2. [LegendLeo/deeplx-serverless](https://github.com/LegendLeo/deeplx-serverless) - 原项目
3. [bropines/Deeplx-vercel](https://github.com/bropines/Deeplx-vercel) - 参考部分实现
