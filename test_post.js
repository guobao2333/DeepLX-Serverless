import axios from 'axios';

axios.post('http://localhost:6119/translate', {
  "text": "hello, world!",
  "source_lang": "en",
  "target_lang": "zh",
  "alt_count": 2
}, {
  headers: {"Content-Type": "application/json"}
})
.then(response => {
  console.log(response.data);
})
.catch(err => {
  console.error(err);
});