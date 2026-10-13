fetch('http://localhost:6119/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'hello, world!',
    source_lang: 'en',
    target_lang: 'zh'
  })
})
.then(async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }
  console.log(data);
})
.catch((err) => console.error(err));
