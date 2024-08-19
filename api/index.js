import express from 'express';
import fetch from 'node-fetch';

const app = express();

app.all('*', (req, res) => {
  const { method, body } = req;
  const domain = req.get('host');

  // 转发请求
  const response = await fetch(`https://${domain}/server.js`, {
    method,
    body: method === 'GET' ? null : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });

  // 返回响应
  const data = await response.json();
  res.status(response.status).json(data);
});
