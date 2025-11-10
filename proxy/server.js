const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();

const API_URL = 'http://localhost:5000/api/responses';
const PROJECT_ID = 'YOUR_PROJECT_ID'; // This should be configured by the user

const sendResponseToBackend = async (data) => {
  try {
    await axios.post(API_URL, data);
  } catch (error) {
    console.error('Failed to send response to backend:', error.message);
  }
};

const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3001', // Your local backend URL
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    let body = [];
    proxyRes.on('data', (chunk) => {
      body.push(chunk);
    });
    proxyRes.on('end', () => {
      body = Buffer.concat(body).toString();
      const responseData = {
        projectId: PROJECT_ID,
        requestMethod: req.method,
        requestUrl: req.url,
        requestHeaders: req.headers,
        requestBody: req.body,
        responseStatusCode: proxyRes.statusCode,
        responseHeaders: proxyRes.headers,
        responseBody: body,
      };
      sendResponseToBackend(responseData);
    });
  },
});

app.use('/', apiProxy);

const PORT = 8080;

app.listen(PORT, () => console.log(`Proxy server started on port ${PORT}`));
