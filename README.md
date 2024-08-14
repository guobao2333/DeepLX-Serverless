# DeepLX Serverless

DeepLX 免费翻译API**函数部署版**，与[原项目DeepLX](https://github.com/OwO-Network/DeepLX)的区别在于**利用了云函数的请求IP不固定的特性，极大程度上避免了`429`请求太频繁报错**

## Usage | 用法

### Prerequisites | 你需要准备什么

- 一双灵活的小手
- 一个聪明的脑袋瓜
- 安装nodejs

### Deploy | 部署

使用任意支持云函数部署的服务器，比如可以使用vercel进行部署，又或者其他能够使用nodejs的服务器。(几乎大多数服务器提供商都提供函数计算服务器)

如果你拥有[vercel](https://vercel.com)账号的话那就很简单了，因为你只需要点击下方按钮即可一键部署到Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fguobao2333%2FDeepLX-Serverless%2Ftree%2Fmain)

项目当前没有任何需要填写的变量值，但在后续可能会添加。

#### 自托管

尽管本项目是专为 serverless 适配的方案，但是也能使用自己的服务器进行部署：

```bash
git clone https://github.com/guobao/DeepLX-Serverless
cd DeepLX-Serverless
npm i
npm run start
```

<details>
<summary>直接复制到命令行运行：点击展开</summary>

```bash
git clone https://github.com/guobao/DeepLX-Serverless && cd DeepLX-Serverless && npm i && npm run start
```
</details>

你可以运行`npm run test`用来测试翻译接口。

### How To Use | 如何使用

使用post通过 `域名` + `/translate` + `json请求体` 这样的形式获取json响应。

请求示例：

```bash
curl --location --request POST 'https://YOUR-DOMAIN/translate' \
--header 'Content-Type: application/json' \
--data-raw '{
    "text": "Hello, World!",
    "source_lang": "en",
    "target_lang": "zh",
    "alternative_number": 3
}'
```

<details>
<summary>直接复制到命令行运行本地测试：点击展开</summary>

```bash
curl --location 'http://localhost:9000/translate' --header 'Content-Type: application/json' --data '{"text": "你好，世界！", "source_lang": "zh", "target_lang": "en", "alternative_number": 3}'
```
</details>

**请修改`YOUR-DOMAIN`为你部署服务的域名！！**

-----------------

响应示例：

```json
{
  "code": 200,
  "message": "success",
  "data": "Hello, world.",
  "source_lang": "en",
  "target_lang": "zh",
  "alternatives": ["Hello, World.", "Hello, world!", "Hi, world."]
}
```

部署完成后，建议搭配浏览器插件「沉浸式翻译」一同使用。

## 沉浸式翻译设置

1. 在浏览器上安装最新的 [沉浸式翻译](https://github.com/immersive-translate/immersive-translate/releases)。
2. 点击左下角的 "开发者设置"。启用测试版实验功能。
3. 翻译服务选中 `DeepLX(beta)`
3. 设置 URL 为刚才获取的访问路径（需带translate）。

![沉浸式翻译](https://github.com/LegendLeo/deeplx-serverless/assets/25115173/d3affe2b-9e99-4d5c-bc8c-cd67e70d0368)

## 鸣谢
1. [OwO-Network/DeepLX](https://github.com/OwO-Network/DeepLX)
2. [LegendLeo/deeplx-serverless](https://github.com/LegendLeo/deeplx-serverless)
3. [bropines/Deeplx-vercel](https://github.com/bropines/Deeplx-vercel)