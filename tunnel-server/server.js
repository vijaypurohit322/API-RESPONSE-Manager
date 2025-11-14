const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const crypto = require('crypto');
const rateLimiter = require('./middleware/rateLimiter');
const security = require('./middleware/security');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = process.env.TUNNEL_SERVER_PORT || 9000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const BASE_DOMAIN = process.env.TUNNEL_BASE_URL || 'tunnel.arm.dev';

// Store active tunnel connections
// Map: subdomain -> { ws, tunnelId, userId, localPort, rateLimit, auth, ipWhitelist }
const activeTunnels = new Map();

// Store pending requests waiting for tunnel response
// Map: requestId -> { res, timeout }
const pendingRequests = new Map();

// Generate unique request ID
const generateRequestId = () => crypto.randomBytes(16).toString('hex');

// WebSocket connection handler for tunnel clients
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection from:', req.socket.remoteAddress);
  
  let tunnelInfo = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'register':
          await handleTunnelRegistration(ws, data);
          tunnelInfo = data;
          break;

        case 'response':
          await handleTunnelResponse(data);
          break;

        case 'heartbeat':
          ws.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }));
          break;

        case 'error':
          handleTunnelError(data);
          break;

        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });

  ws.on('close', () => {
    if (tunnelInfo) {
      console.log(`Tunnel disconnected: ${tunnelInfo.subdomain}`);
      const tunnel = activeTunnels.get(tunnelInfo.subdomain);
      activeTunnels.delete(tunnelInfo.subdomain);
      
      // Cleanup security configs
      rateLimiter.remove(tunnelInfo.subdomain);
      security.remove(tunnelInfo.subdomain);
      
      // Update tunnel status in backend
      if (tunnel) {
        updateTunnelStatus(tunnelInfo.tunnelId, 'inactive', null, tunnel.authToken).catch(console.error);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle tunnel registration
async function handleTunnelRegistration(ws, data) {
  const { tunnelId, subdomain, userId, localPort, authToken } = data;

  try {
    // Verify tunnel exists in backend
    const response = await axios.get(`${BACKEND_URL}/api/tunnels/${tunnelId}`, {
      headers: { 'x-auth-token': authToken }
    });

    const tunnelData = response.data.tunnel;

    if (tunnelData.subdomain !== subdomain) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Subdomain mismatch' 
      }));
      ws.close();
      return;
    }

    // Check if subdomain is already active
    if (activeTunnels.has(subdomain)) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Subdomain already in use' 
      }));
      ws.close();
      return;
    }

    // Register tunnel with security config
    activeTunnels.set(subdomain, {
      ws,
      tunnelId,
      userId,
      localPort,
      authToken, // Store auth token for status updates
      rateLimit: tunnelData.rateLimit || { requestsPerMinute: 60, enabled: true },
      authentication: tunnelData.authentication || { enabled: false },
      ipWhitelist: tunnelData.ipWhitelist || [],
      connectedAt: Date.now()
    });

    // Configure rate limiter
    if (tunnelData.rateLimit && tunnelData.rateLimit.enabled) {
      rateLimiter.updateLimit(subdomain, tunnelData.rateLimit.requestsPerMinute);
    }

    // Configure security
    if (tunnelData.ipWhitelist && tunnelData.ipWhitelist.length > 0) {
      security.setIPWhitelist(subdomain, tunnelData.ipWhitelist);
    }

    if (tunnelData.authentication && tunnelData.authentication.enabled) {
      security.setAuthentication(subdomain, tunnelData.authentication);
    }

    // Update tunnel status to active
    await updateTunnelStatus(tunnelId, 'active', ws.id, authToken);

    // Send success response
    ws.send(JSON.stringify({
      type: 'registered',
      subdomain,
      publicUrl: `https://${subdomain}.${BASE_DOMAIN}`,
      message: 'Tunnel registered successfully'
    }));

    console.log(`✅ Tunnel registered: ${subdomain} -> localhost:${localPort}`);
  } catch (error) {
    console.error('Registration error:', error.message);
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Failed to register tunnel' 
    }));
    ws.close();
  }
}

// Handle response from tunnel client
async function handleTunnelResponse(data) {
  const { requestId, statusCode, headers, body } = data;

  const pending = pendingRequests.get(requestId);
  if (!pending) {
    console.warn('No pending request found for:', requestId);
    return;
  }

  // Clear timeout
  clearTimeout(pending.timeout);

  // Send response to original HTTP client
  const { res, subdomain } = pending;
  res.status(statusCode);
  
  // Set headers
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  // Calculate bytes transferred
  let bytes = 0;
  if (body) {
    if (typeof body === 'string') {
      bytes = Buffer.byteLength(body, 'utf8');
      res.send(body);
    } else {
      const bodyStr = JSON.stringify(body);
      bytes = Buffer.byteLength(bodyStr, 'utf8');
      res.json(body);
    }
  } else {
    res.end();
  }

  // Update tunnel statistics
  const tunnel = activeTunnels.get(subdomain);
  if (tunnel) {
    try {
      console.log(`📊 Updating stats: ${bytes} bytes for tunnel ${tunnel.tunnelId}`);
      const response = await axios.post(
        `${BACKEND_URL}/api/tunnels/${tunnel.tunnelId}/stats/increment`,
        { bytes },
        { headers: { 'x-auth-token': tunnel.authToken } }
      );
      console.log('✅ Stats updated:', response.data);
    } catch (error) {
      console.error('❌ Failed to update stats:', error.response?.data || error.message);
    }
  }

  // Remove from pending
  pendingRequests.delete(requestId);
}

// Handle error from tunnel client
function handleTunnelError(data) {
  const { requestId, error } = data;

  const pending = pendingRequests.get(requestId);
  if (!pending) return;

  clearTimeout(pending.timeout);
  pending.res.status(502).json({ 
    error: 'Tunnel error', 
    message: error 
  });
  
  pendingRequests.delete(requestId);
}

// Update tunnel status in backend
async function updateTunnelStatus(tunnelId, status, connectionId = null, authToken = null) {
  try {
    await axios.put(
      `${BACKEND_URL}/api/tunnels/${tunnelId}/status`,
      { status, connectionId },
      { headers: { 'x-auth-token': authToken || process.env.INTERNAL_AUTH_TOKEN } }
    );
  } catch (error) {
    console.error('Failed to update tunnel status:', error.message);
  }
}

// HTTP request handler - routes requests to appropriate tunnel
app.use((req, res) => {
  // Extract subdomain from host header
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];

  // Check if tunnel exists
  const tunnel = activeTunnels.get(subdomain);
  if (!tunnel) {
    return res.status(404).json({ 
      error: 'Tunnel not found',
      message: `No active tunnel for subdomain: ${subdomain}`
    });
  }

  // Get client IP
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.socket.remoteAddress || 
                   req.connection.remoteAddress;

  // Check IP whitelist
  if (!security.isIPAllowed(subdomain, clientIP)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Your IP address is not allowed to access this tunnel'
    });
  }

  // Check authentication
  const authResult = security.checkAuthentication(subdomain, req);
  if (!authResult.allowed) {
    res.status(authResult.statusCode || 401);
    if (authResult.headers) {
      Object.entries(authResult.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }
    return res.json({
      error: 'Authentication failed',
      message: authResult.message
    });
  }

  // Check rate limit
  if (tunnel.rateLimit && tunnel.rateLimit.enabled) {
    if (!rateLimiter.isAllowed(subdomain, tunnel.rateLimit.requestsPerMinute)) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        limit: tunnel.rateLimit.requestsPerMinute,
        current: rateLimiter.getRequestCount(subdomain)
      });
    }
  }

  // Validate and sanitize headers
  security.validateHeaders(req);

  // Generate request ID
  const requestId = generateRequestId();

  // Create request data to send to tunnel client
  const requestData = {
    type: 'request',
    requestId,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  };

  // Store pending request with timeout
  const timeout = setTimeout(() => {
    pendingRequests.delete(requestId);
    res.status(504).json({ 
      error: 'Gateway timeout',
      message: 'Tunnel did not respond in time'
    });
  }, 30000); // 30 second timeout

  pendingRequests.set(requestId, { res, timeout, subdomain });

  // Forward request to tunnel client via WebSocket
  try {
    if (tunnel.ws.readyState !== 1) { // 1 = OPEN
      throw new Error(`WebSocket not ready (state: ${tunnel.ws.readyState})`);
    }
    tunnel.ws.send(JSON.stringify(requestData));
  } catch (error) {
    console.error('❌ Failed to forward request:', error.message);
    clearTimeout(timeout);
    pendingRequests.delete(requestId);
    res.status(502).json({ 
      error: 'Tunnel error',
      message: error.message || 'Failed to forward request to tunnel'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeTunnels: activeTunnels.size,
    pendingRequests: pendingRequests.size,
    uptime: process.uptime()
  });
});

// Cleanup stale connections every 30 seconds
setInterval(() => {
  const now = Date.now();
  const staleTimeout = 60000; // 60 seconds

  for (const [subdomain, tunnel] of activeTunnels.entries()) {
    if (now - tunnel.connectedAt > staleTimeout) {
      console.log(`Removing stale tunnel: ${subdomain}`);
      tunnel.ws.close();
      activeTunnels.delete(subdomain);
      rateLimiter.remove(subdomain);
      security.remove(subdomain);
    }
  }
  
  // Cleanup rate limiter cache
  rateLimiter.cleanup();
}, 30000);

// Start server
server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚇 Tunnel Server Started');
  console.log('='.repeat(60));
  console.log(`WebSocket Server: ws://localhost:${PORT}`);
  console.log(`HTTP Proxy: http://localhost:${PORT}`);
  console.log(`Base Domain: ${BASE_DOMAIN}`);
  console.log(`Active Tunnels: ${activeTunnels.size}`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  
  // Close all tunnel connections
  for (const [subdomain, tunnel] of activeTunnels.entries()) {
    tunnel.ws.close();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
