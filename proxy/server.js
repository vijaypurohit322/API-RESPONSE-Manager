const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();

const API_URL = 'http://localhost:5000/api/responses';
const PROJECT_ID = '69119321dff6271fdce6e1fe'; // Test Project ID

const sendResponseToBackend = async (data) => {
  try {
    const response = await axios.post(API_URL, data);
    console.log('✅ Response captured and sent to API Response Manager');
    console.log('   Project ID:', data.projectId);
    console.log('   Endpoint:', data.requestMethod, data.requestUrl);
    console.log('   Status:', data.responseStatusCode);
  } catch (error) {
    console.error('❌ Failed to send response to backend:', error.message);
    console.error('   Backend URL:', API_URL);
    console.error('   Error details:', error.code || error.response?.status);
    if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Backend server is NOT running on port 5000!');
      console.error('   ⚠️  Start it with: cd backend && npm start');
    }
  }
};

const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000', // Test Python API Server
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

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Proxy Server Started');
  console.log('='.repeat(60));
  console.log(`Listening on: http://localhost:${PORT}`);
  console.log(`Forwarding to: http://localhost:3000`);
  console.log(`Sending captures to: ${API_URL}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log('='.repeat(60));
});
