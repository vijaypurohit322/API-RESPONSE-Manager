// Simple test using built-in http module
const http = require('http');

const testData = JSON.stringify({
  projectId: '69119321dff6271fdce6e1fe',
  requestMethod: 'GET',
  requestUrl: '/api/test-connection',
  requestHeaders: {},
  requestBody: {},
  responseStatusCode: 200,
  responseHeaders: {},
  responseBody: '{"test": "connection"}'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/responses',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length
  }
};

console.log('Testing backend connection on port 5000...\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ SUCCESS! Backend is reachable and responding');
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    console.log('\n📊 Check your UI - you should see this test response!');
    console.log('   http://localhost:5173/projects/69119321dff6271fdce6e1fe');
  });
});

req.on('error', (error) => {
  console.log('❌ FAILED! Backend is NOT reachable');
  console.log('Error:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.log('\n⚠️  Backend server is NOT running on port 5000');
    console.log('   Start it with: cd backend && npm start');
  }
});

req.write(testData);
req.end();
