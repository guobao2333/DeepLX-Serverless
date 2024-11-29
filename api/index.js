import express from 'express';
import { post, get } from '../src/server.js';

const app = express();

app.post('/translate', async (req, res) => {
  // 转发请求
  const response = await post(req, res);

  // 返回响应
  const data = await response.json();
  res.status(response.status).json(data);
});

app.get('/', async (req, res) => await get(req, res));