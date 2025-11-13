const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const greenlock = require('greenlock-express');

// SSL/TLS Proxy with Let's Encrypt support
// This sits in front of the tunnel server and handles HTTPS termination

const TUNNEL_SERVER_URL = process.env.TUNNEL_SERVER_URL || 'http://localhost:9000';
const DOMAIN = process.env.DOMAIN || 'tunnel.arm.dev';
const EMAIL = process.env.LETSENCRYPT_EMAIL || 'admin@arm.dev';
const STAGING = process.env.LETSENCRYPT_STAGING === 'true';

// For development: use self-signed certificates
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  console.log('⚠️  Running in DEVELOPMENT mode with self-signed certificates');
  console.log('⚠️  For production, set NODE_ENV=production and configure Let\'s Encrypt');
  
  // Create self-signed cert if it doesn't exist
  const certPath = path.join(__dirname, 'certs');
  if (!fs.existsSync(certPath)) {
    fs.mkdirSync(certPath, { recursive: true });
    console.log('📁 Created certs directory');
    console.log('🔐 Generate self-signed certificate with:');
    console.log('   openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes');
  }

  const keyPath = path.join(certPath, 'key.pem');
  const certFilePath = path.join(certPath, 'cert.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certFilePath)) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certFilePath)
    };

    const server = https.createServer(options, (req, res) => {
      // Forward to tunnel server
      const proxyReq = http.request({
        hostname: 'localhost',
        port: 9000,
        path: req.url,
        method: req.method,
        headers: req.headers
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.writeHead(502);
        res.end('Bad Gateway');
      });

      req.pipe(proxyReq);
    });

    server.listen(443, () => {
      console.log('🔒 HTTPS Proxy listening on port 443');
      console.log(`   Forwarding to: ${TUNNEL_SERVER_URL}`);
    });
  } else {
    console.error('❌ SSL certificates not found. Please generate them first.');
    process.exit(1);
  }

} else {
  // Production: Use Let's Encrypt with Greenlock
  console.log('🚀 Starting production HTTPS server with Let\'s Encrypt');

  greenlock.init({
    packageRoot: __dirname,
    configDir: './greenlock.d',
    maintainerEmail: EMAIL,
    cluster: false,
    
    // Staging for testing, production for real certs
    staging: STAGING
  })
  .ready((glx) => {
    // Serve HTTPS
    const httpsServer = glx.httpsServer(null, (req, res) => {
      // Forward to tunnel server
      const proxyReq = http.request({
        hostname: 'localhost',
        port: 9000,
        path: req.url,
        method: req.method,
        headers: req.headers
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.writeHead(502);
        res.end('Bad Gateway');
      });

      req.pipe(proxyReq);
    });

    httpsServer.listen(443, '0.0.0.0', () => {
      console.log('='.repeat(60));
      console.log('🔒 HTTPS Proxy with Let\'s Encrypt');
      console.log('='.repeat(60));
      console.log(`Domain: ${DOMAIN}`);
      console.log(`Email: ${EMAIL}`);
      console.log(`Staging: ${STAGING}`);
      console.log(`Forwarding to: ${TUNNEL_SERVER_URL}`);
      console.log('='.repeat(60));
    });

    // Serve HTTP (redirect to HTTPS)
    const httpServer = glx.httpServer();
    httpServer.listen(80, '0.0.0.0', () => {
      console.log('📡 HTTP server listening on port 80 (redirects to HTTPS)');
    });
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
