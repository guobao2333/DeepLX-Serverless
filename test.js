const { translate } = require('./translate');

(async () => {
  // Example Call
  await translate('各位评委好，我是练习时长两年半的个人练习生，蔡徐坤', 'ZH', 'EN', 3, true);
  console.log('\n');
  await translate('鸡你太美，baby，鸡你实在是太美，baby', 'ZH', 'EN', 0, true)
})()
