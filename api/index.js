// import express from 'express';
import fetch from 'node-fetch';

// const app = express();

export default async (req, res) => {
  const { method, body, hostname, ip } = req;
  const domain = hostname || ip;

  // 转发请求
  const response = await fetch(`https://${domain}/server.js`, {
    method,
    body: method === 'GET' ? null : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });

  // 返回响应
  const data = await response.json();
  res.status(response.status).json(data);
};
