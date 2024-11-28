import { translate } from './src/translate.js';

(async () => {
  await translate('how are you?', 'en', 'zh', '', false, true);
})();
