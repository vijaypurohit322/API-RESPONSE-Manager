const http = require('http');

const PORT = 30003;

const server = http.createServer((req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Hello from your local server!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers
  }, null, 2));
});

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Test Server Started');
  console.log('='.repeat(60));
  console.log(`Listening on: http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
  console.log('='.repeat(60));
});
