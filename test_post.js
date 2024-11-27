import axios from 'axios';

axios.post('http://localhost:6119/translate', {
  "text": "你好，世界！",
  "source_lang": "zh",
  "target_lang": "en"
}, {
  headers: {"Content-Type": "application/json"}
})
.then(response => {
  console.log(response.data);
})
.catch(err => {
  console.error(err);
});