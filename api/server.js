const express = require('express');
const bodyParser = require('body-parser');
const { translate } = require('./translate');

const app = express();
const PORT = 9000;

app.use(bodyParser.json());

app.post('/translate', async (req, res) => {
  const { text, source_lang, target_lang } = req.body;

  try {
    const result = await translate(text, source_lang, target_lang);
    const responseData = {
      alternatives: result.alternatives,
      code: 200,
      data: result.text, // 取第一个翻译结果
      id: Math.floor(Math.random() * 10000000000), // 生成一个随机 ID
      method: 'Free',
      source_lang,
      target_lang,
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: 'Translation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
