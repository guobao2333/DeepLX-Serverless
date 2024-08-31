import { translate } from './translate.js';

(async () => {
  // Example Call
  await translate('各位评委好，我是练习时长两年半的个人练习生，蔡徐坤', 'ZH', 'EN', 3, true);
  console.log('\n');
})()
