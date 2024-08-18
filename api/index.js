import express from 'express';
import fetch from 'node-fetch';

const PORT = 9000;
const app = express();

export default async (req, res) => {
  const { method, body, url } = req;

  // 转发请求
  const response = await fetch(`http://localhost:${PORT}/server.js`, {
    method,
    body: method === 'GET' ? null : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });

  // 返回响应
  const data = await response.json();
  res.status(response.status).json(data);
};

// 启动本地服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});