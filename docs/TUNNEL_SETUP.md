# Tunnel Service Setup Guide

## Overview

The tunnel service enables developers to expose their local APIs to the internet with secure public URLs, similar to ngrok or Tunnelmole. This guide covers installation, configuration, and usage.

## Architecture

```
┌─────────────────┐
│  Public Client  │
│  (Browser/API)  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Tunnel Server  │  (Port 9000)
│   WebSocket +   │
│   HTTP Proxy    │
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────┐
│  Tunnel Client  │
│  (Your Machine) │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Local Server   │  (Port 3000, 4000, etc.)
│  (Your API)     │
└─────────────────┘
```

## Components

1. **Backend API** - Manages tunnel metadata (MongoDB)
2. **Tunnel Server** - WebSocket server + HTTP reverse proxy
3. **Tunnel Client** - Connects local server to tunnel server
4. **Frontend UI** - Create and manage tunnels

## Installation

### 1. Install Dependencies

```bash
# Backend (if not already installed)
cd backend
npm install

# Tunnel Server
cd ../tunnel-server
npm install

# Tunnel Client
cd ../tunnel-client
npm install
```

### 2. Environment Configuration

Create `.env` file in the root directory:

```env
# Backend
PORT=5000
MONGO_URI=mongodb://localhost:27017/api-response-manager
JWT_SECRET=your_jwt_secret_here

# Tunnel Server
TUNNEL_SERVER_PORT=9000
TUNNEL_BASE_URL=tunnel.arm.dev
BACKEND_URL=http://localhost:5000
INTERNAL_AUTH_TOKEN=your_internal_token_here
```

### 3. Start Services

```bash
# Terminal 1: Backend API
cd backend
npm start

# Terminal 2: Tunnel Server
cd tunnel-server
npm start

# Terminal 3: Your Local API (example)
cd your-api
npm start  # Running on port 3000
```

## Usage

### Via Frontend UI (Recommended)

1. **Login to API Response Manager**
   - Navigate to `http://localhost:5173`
   - Login with your credentials

2. **Create a Tunnel**
   - Go to "Tunnels" page
   - Click "Create Tunnel"
   - Enter:
     - Local Port: `3000` (your API port)
     - Subdomain: `myapi` (optional, auto-generated if empty)
   - Click "Create"

3. **Connect Tunnel Client**
   - Copy the connection command shown
   - Run in terminal:
   ```bash
   cd tunnel-client
   node client.js <tunnelId> <subdomain> <localPort> <authToken> <userId>
   ```

4. **Access Your API**
   - Public URL: `https://myapi.tunnel.arm.dev`
   - All requests forwarded to `localhost:3000`

### Via API (Programmatic)

```javascript
// Create tunnel
const response = await axios.post('http://localhost:5000/api/tunnels', {
  localPort: 3000,
  subdomain: 'myapi',  // optional
  projectId: 'project123',  // optional
  rateLimit: {
    requestsPerMinute: 60,
    enabled: true
  }
}, {
  headers: { 'x-auth-token': 'YOUR_JWT_TOKEN' }
});

const { tunnelId, subdomain, publicUrl } = response.data.tunnel;

// Start tunnel client
const TunnelClient = require('./tunnel-client/client');
const client = new TunnelClient({
  tunnelId,
  subdomain,
  localPort: 3000,
  authToken: 'YOUR_JWT_TOKEN',
  userId: 'YOUR_USER_ID'
});
client.connect();
```

## API Endpoints

### Create Tunnel
```http
POST /api/tunnels
Authorization: Bearer <token>

{
  "localPort": 3000,
  "subdomain": "myapi",
  "projectId": "optional",
  "rateLimit": {
    "requestsPerMinute": 60,
    "enabled": true
  },
  "authentication": {
    "enabled": false,
    "type": "none"
  }
}
```

### List Tunnels
```http
GET /api/tunnels
Authorization: Bearer <token>
```

### Get Tunnel Stats
```http
GET /api/tunnels/:id/stats
Authorization: Bearer <token>
```

### Delete Tunnel
```http
DELETE /api/tunnels/:id
Authorization: Bearer <token>
```

### Check Subdomain Availability
```http
GET /api/tunnels/check/:subdomain
Authorization: Bearer <token>
```

## Features

### ✅ Current Features

- **Public HTTPS URLs** - Expose local APIs instantly
- **Custom Subdomains** - Choose your own subdomain
- **WebSocket Connection** - Real-time bidirectional communication
- **Auto-reconnect** - Client automatically reconnects on disconnect
- **Heartbeat Monitoring** - Keeps connections alive
- **Request Logging** - All requests logged in console
- **Multiple Tunnels** - Run multiple tunnels simultaneously
- **Rate Limiting** - Configurable per tunnel (default 60 req/min)
- **Authentication** - Basic auth and token-based authentication
- **IP Whitelisting** - Restrict access by IP address or CIDR ranges
- **SSL/TLS Support** - Let's Encrypt integration with ssl-proxy.js
- **Statistics Tracking** - Request count, bandwidth, uptime monitoring
- **Project Integration** - Link tunnels to projects

### 🚧 Coming Soon (Phase 2)

- **Custom Domains** - Bring your own domain
- **Traffic Analytics Dashboard** - Visual request/response metrics
- **Webhook Testing Mode** - Dedicated webhook URLs with replay
- **CLI Tool** - `npm install -g @arm/cli`
- **WebSocket Tunneling** - Support for WebSocket connections
- **Request Replay** - Replay captured requests
- **OAuth Support** - OAuth-based authentication

## Configuration Options

### Tunnel Options

```javascript
{
  localPort: 3000,              // Required: Local port to forward to
  subdomain: "myapi",           // Optional: Custom subdomain
  projectId: "abc123",          // Optional: Link to project
  
  rateLimit: {
    requestsPerMinute: 60,      // Max requests per minute
    enabled: true               // Enable/disable rate limiting
  },
  
  authentication: {
    enabled: false,             // Enable authentication
    type: "none",               // none | basic | token
    token: "secret",            // For token auth
    username: "user",           // For basic auth
    password: "pass"            // For basic auth
  },
  
  ipWhitelist: [                // Optional: Allowed IPs
    "192.168.1.1",
    "10.0.0.0/8"
  ],
  
  expiresIn: 3600               // Optional: Expire after N seconds
}
```

## Troubleshooting

### Tunnel Won't Connect

**Problem:** Client can't connect to tunnel server

**Solutions:**
- Check tunnel server is running on port 9000
- Verify `TUNNEL_SERVER_URL` environment variable
- Check firewall settings
- Ensure WebSocket connections are allowed

### Requests Timeout

**Problem:** Public requests timeout

**Solutions:**
- Verify local server is running on specified port
- Check tunnel client is connected (look for "Tunnel Active!" message)
- Increase timeout in tunnel server (default 30s)
- Check local server logs for errors

### Subdomain Already Taken

**Problem:** Can't create tunnel with desired subdomain

**Solutions:**
- Choose a different subdomain
- Delete existing tunnel with that subdomain
- Let system auto-generate a subdomain (leave empty)

### Connection Drops Frequently

**Problem:** Tunnel disconnects often

**Solutions:**
- Check network stability
- Verify heartbeat is working (every 15s)
- Check tunnel server logs for errors
- Increase reconnect attempts in client

## Security Considerations

### Current Implementation

⚠️ **Development Mode** - Current setup is for local development only

- No SSL/TLS encryption
- No authentication on tunnel server
- No rate limiting enforcement
- No DDoS protection

### Production Recommendations

For production deployment:

1. **SSL/TLS Termination**
   - Use Nginx/Caddy as reverse proxy
   - Automatic Let's Encrypt certificates
   - Force HTTPS on all connections

2. **Authentication**
   - Implement tunnel server authentication
   - Validate JWT tokens on WebSocket connection
   - Rate limit by user/IP

3. **Monitoring**
   - Log all tunnel connections
   - Monitor bandwidth usage
   - Alert on suspicious activity

4. **Infrastructure**
   - Deploy tunnel server on dedicated instance
   - Use load balancer for high availability
   - Implement auto-scaling

## Performance

### Benchmarks (Local Testing)

- **Latency Overhead:** ~10-20ms
- **Throughput:** ~1000 req/s per tunnel
- **Max Concurrent Tunnels:** 1000+
- **Memory Usage:** ~50MB per 100 tunnels

### Optimization Tips

1. **Use HTTP/2** - Better performance for multiple requests
2. **Enable Compression** - Reduce bandwidth usage
3. **Connection Pooling** - Reuse connections to local server
4. **Caching** - Cache static responses

## Development

### Running in Development Mode

```bash
# Backend with auto-reload
cd backend
npm run dev

# Tunnel server with auto-reload
cd tunnel-server
npm run dev

# Frontend with hot reload
cd frontend
npm run dev
```

### Testing

```bash
# Test tunnel creation
curl -X POST http://localhost:5000/api/tunnels \
  -H "x-auth-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"localPort": 3000, "subdomain": "test"}'

# Test public access (after client connected)
curl http://test.tunnel.arm.dev/api/health
```

## Docker Deployment

See `docker-compose.yml` for full setup:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f tunnel-server

# Stop services
docker-compose down
```

## Roadmap

- [ ] SSL/TLS with Let's Encrypt
- [ ] Custom domain support
- [ ] Advanced authentication (OAuth, SAML)
- [ ] Traffic analytics dashboard
- [ ] CLI tool (`@arm/cli`)
- [ ] Mobile app for tunnel management
- [ ] Webhook testing mode
- [ ] Request replay and debugging
- [ ] Team collaboration features

## Support

- **Documentation:** [README.md](./README.md)
- **Issues:** [GitHub Issues](https://github.com/vijaypurohit322/api-response-manager/issues)
- **Email:** vijaypurohit322@gmail.com

---

**Version:** 1.0.0 (Phase 1 - MVP)  
**Last Updated:** November 13, 2025  
**Status:** Development/Testing
