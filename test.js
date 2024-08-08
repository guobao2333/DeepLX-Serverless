const translate = require('./translate');

;(async () => {
  // Example Call
  console.log(await translate('你好，我是练习时长两年半的个人练习生', 'ZH', 'EN', true, true));
  console.log(
    await translate(
      'Generate a cryptographically strong random string',
      'EN',
      'ZH',
      true,
      true
    )
  );
})()
