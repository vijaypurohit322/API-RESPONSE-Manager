// Test if proxy can reach backend
const axios = require('axios');

const testData = {
  projectId: '69119321dff6271fdce6e1fe',
  requestMethod: 'GET',
  requestUrl: '/api/test-connection',
  requestHeaders: {},
  requestBody: {},
  responseStatusCode: 200,
  responseHeaders: {},
  responseBody: '{"test": "connection"}'
};

console.log('Testing proxy → backend connection...\n');

axios.post('http://localhost:5000/api/responses', testData)
  .then(response => {
    console.log('✅ SUCCESS! Backend is reachable');
    console.log('Response ID:', response.data._id);
    console.log('\nNow check your UI - you should see this test response!');
    console.log('http://localhost:5173/projects/69119321dff6271fdce6e1fe');
  })
  .catch(error => {
    console.log('❌ FAILED!');
    if (error.code === 'ECONNREFUSED') {
      console.log('Backend is NOT running on port 5000');
      console.log('Start it with: cd backend && npm start');
    } else {
      console.log('Error:', error.message);
    }
  });
