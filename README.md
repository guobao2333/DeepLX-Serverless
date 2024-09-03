# DeepLX Serverless

DeepLX 免费翻译API**函数部署版**，与原项目[DeepLX](https://github.com/OwO-Network/DeepLX)的区别在于**利用了无服务器函数(也叫边缘函数)的请求IP不固定的特性，极大程度上避免了`429`请求太频繁报错**

**如果本项目对你有用的话，不妨点个`Star`❤️**  
**Click `Star` if you like!! thanks❤️**

## Major Changes | 重大改变

如果您在这之前不使用本项目，此部分可以跳过。
1. 新增了docker部署支持
2. 请求参数变化： `alternative_number` -> `alt_count`

## Let's Go | 开始使用
### Prerequisites | 你需要准备什么

- 一双灵活的小手
- 一个聪明的脑袋瓜
- 支持 `Nodejs ≥16.13` 或 `Serverless Function` 的服务器

### Deploy | 部署

使用任意支持无服务器函数部署的服务器，比如可以使用 `Vercel` 或者 `Netlify` 进行部署，又或者其他能够使用nodejs的服务器。(大多数服务器提供商都提供函数计算服务器)  

如果你拥有[Vercel](https://vercel.com)账号的话那就很简单了，因为你只需要点击下方按钮即可一键部署到Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/guobao2333/DeepLX-Serverless)

<!-- 你也可以在[Netlify](https://netlify.com)上一键部署本项目：  
(但目前正在测试中，多平台兼容好难啊……)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/guobao2333/DeepLX-Serverless) -->

因维护者我有多个仓库需要维护，短时间内将无法对多平台部署方案进行兼容，您可以先打开一个`issues`并选择**自托管**方案。  
✨项目当前没有任何需要填写的变量值，但在后续可能会添加。

如果部署完成了，就可以开始使用啦！🎉
#### Docker

直接运行容器：
```bash
docker run -d -p 9000:9000 deeplx-api
```

你还可以自己构建后运行：
```bash
docker build -t deeplx-api .
docker run -d -p 9000:9000 deeplx-api
```

#### Self hosting | 自托管

✅尽管本项目是专为 serverless 适配的方案，但是也能使用自己的服务器进行部署：
```bash
git clone https://github.com/guobao2333/DeepLX-Serverless
cd DeepLX-Serverless
npm i
npm run start
```

📋直接复制到命令行运行：
```bash
git clone https://github.com/guobao2333/DeepLX-Serverless && cd DeepLX-Serverless && npm i && npm run start
```

🚧你可以运行`npm run test`用来测试翻译接口。  
⚠️注意！测试命令仅返回翻译内容，获取所有结果需要使用`POST`！

### How To Use | 如何使用

使用post通过 `域名地址` + `/translate` + `json请求体` 这样的形式获取json响应。

详细API文档，请查看本项目的wiki：  
[English](https://github.com/guobao2333/DeepLX-Serverless/wiki/English-document) | [简体中文](https://github.com/guobao2333/DeepLX-Serverless/wiki/%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)

📋你可以直接复制到命令行运行**本地测试：**
```bash
curl --location --request POST 'http://localhost:9000/translate' --header 'Content-Type: application/json' --data '{"text": "你好，世界！", "source_lang": "zh", "target_lang": "en"}'
```

✨部署完成后，建议搭配浏览器插件「沉浸式翻译」一同使用。

## 沉浸式翻译设置

1. 在浏览器上安装最新的 [沉浸式翻译](https://github.com/immersive-translate/immersive-translate/releases)。
2. 点击左下角的 "开发者设置"。启用测试版实验功能。
3. 翻译服务选中 `DeepLX(beta)`
4. 设置 URL 为刚才获取的访问路径（需带translate）。

![沉浸式翻译](https://github.com/LegendLeo/deeplx-serverless/assets/25115173/d3affe2b-9e99-4d5c-bc8c-cd67e70d0368)

## Contribute | 贡献
> [!IMPORTANT]
> 在您做出贡献之前请先阅读理解并遵守以下内容：
> **先切换到`dev`分支，并同步最新代码！！**  
> 由于我已对`main`分支做出限制，所以**不要试图在`main`分支打开拉取请求！！**  
> ***不要对相同代码进行多次拉取请求！！***

本人因时间(和各种各样的)原因，故无法及时对您的贡献进行测试，所以您还需要**自行测试**。

在您打开拉取请求之前，请先进行测试，测试完毕后再来请求合并！！点名批评多次拉取请求！我不希望看到太多垃圾信息。

如果你是第一次，而且真的想贡献点什么，那么请查看[如何为开源做贡献](https://opensource.guide/how-to-contribute/)，不过我喜欢叫它「开源贡献指南」，那里有你需要的一切。

**严肃说明：**  
不要试图挑战我的耐心，我认为我已经做出足够多的说明了，否则你将失去对我的存储库的访问权！请记住，我可以单方面屏蔽任何人。

## Star History

<a href="https://star-history.com/#guobao2333/DeepLX-Serverless&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=guobao2333/DeepLX-Serverless&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=guobao2333/DeepLX-Serverless&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=guobao2333/DeepLX-Serverless&type=Date" />
 </picture>
</a>

## Acknowledgments | 鸣谢

1. [OwO-Network/DeepLX](https://github.com/OwO-Network/DeepLX)
2. [LegendLeo/deeplx-serverless](https://github.com/LegendLeo/deeplx-serverless)
3. [bropines/Deeplx-vercel](https://github.com/bropines/Deeplx-vercel)
