import { translate } from './src/translate.js';

(async () => {
translate('How are you?', 'en', 'zh', false)
  .then(result => console.log(result))
  .catch(err => console.error(err));
})();
