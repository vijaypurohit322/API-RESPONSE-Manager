// Quick test to verify backend is reachable
const axios = require('axios');

const testData = {
  projectId: '6911d534387d845aaecc8895',
  requestMethod: 'GET',
  requestUrl: '/api/test',
  requestHeaders: { 'content-type': 'application/json' },
  requestBody: {},
  responseStatusCode: 200,
  responseHeaders: { 'content-type': 'application/json' },
  responseBody: '{"test": "data"}'
};

console.log('Testing backend connection...');
console.log('Sending POST to http://localhost:5000/api/responses');

axios.post('http://localhost:5000/api/responses', testData)
  .then(response => {
    console.log('✅ SUCCESS! Backend is reachable and accepting requests');
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.log('❌ FAILED! Backend is not reachable');
    if (error.code === 'ECONNREFUSED') {
      console.log('Error: Connection refused - Backend is NOT running on port 5000');
    } else if (error.response) {
      console.log('Error:', error.response.status, error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  });
