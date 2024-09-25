import { translate } from './translate.js';

(async () => {
/**
 * 一个示例调用，用于非http协议的服务内调用
 * 你可以在其他js中调用，无需运行 'npm start'
 * 如果无需在控制台打印，最后一个布尔值参数可以去掉
 *
 * @async
 * @param {string} text - 待翻译的文本
 * @param {string} [sourceLang='AUTO'] - 源语言国家/地区代号 默认自动识别
 * @param {string} targetLang - 目标语言国家/地区代号
 * @param {number} [alternativeCount] - 请求的备选翻译数量
 * @param {boolean} [printResult] - 控制台打印返回结果
 * @returns {Promise<Object>} translationData - 返回翻译数据JSON对象
 * @typedef {Object} translationData
 * @property {number} code - http状态码
 * @property {string} data - 翻译结果
 * @property {number} id
 * @property {string} method - 请求的接口类型 目前只有Free
 * @property {string} source_lang - 源语言国家/地区代号
 * @property {string} target_lang - 目标语言国家/地区代号
 * @property {Array<string>} alternatives - 备选翻译列表
 */
  await translate('你好，世界！', 'zh', 'en', 3, true);
})();
