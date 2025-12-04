const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const rateLimiter = require('./middleware/rateLimiter');
const security = require('./middleware/security');
const samlHandler = require('./auth/samlHandler');

const app = express();

// Parse URL-encoded bodies for SAML POST responses
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = process.env.PORT || process.env.TUNNEL_SERVER_PORT || 9000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const BASE_DOMAIN = process.env.TUNNEL_BASE_URL || 'free-tunnelapi.app';

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
          // Update last heartbeat time for the tunnel
          if (data.subdomain && activeTunnels.has(data.subdomain)) {
            const tunnel = activeTunnels.get(data.subdomain);
            tunnel.lastHeartbeat = Date.now();
          }
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

// SAML Authentication Routes
// These must be defined before the catch-all tunnel handler

// SAML Assertion Consumer Service (ACS) - handles IdP response
app.post('/auth/saml/callback', async (req, res) => {
  try {
    const { SAMLResponse, RelayState } = req.body;
    
    if (!SAMLResponse) {
      return res.status(400).json({ error: 'Missing SAML response' });
    }

    // RelayState contains the tunnelId
    const tunnelId = RelayState;
    
    if (!tunnelId) {
      return res.status(400).json({ error: 'Missing tunnel identifier' });
    }

    // Fetch tunnel from backend
    const tunnelResponse = await axios.get(`${BACKEND_URL}/api/tunnels/${tunnelId}`);
    const tunnel = tunnelResponse.data.tunnel || tunnelResponse.data;

    if (!tunnel || !tunnel.authentication?.saml) {
      return res.status(404).json({ error: 'SAML not configured for this tunnel' });
    }

    // Handle SAML assertion
    const result = await samlHandler.handleAssertion(tunnel, SAMLResponse);

    if (result.success) {
      // Set session cookie and redirect to tunnel
      res.cookie('saml_session', result.sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Redirect to the tunnel's public URL
      res.redirect(tunnel.publicUrl);
    } else {
      res.status(401).json({ error: 'SAML authentication failed' });
    }
  } catch (error) {
    console.error('SAML callback error:', error);
    res.status(500).json({ error: 'SAML authentication error', message: error.message });
  }
});

// SAML metadata endpoint
app.get('/auth/saml/metadata/:tunnelId', async (req, res) => {
  try {
    const { tunnelId } = req.params;
    
    // Fetch tunnel from backend
    const tunnelResponse = await axios.get(`${BACKEND_URL}/api/tunnels/${tunnelId}`);
    const tunnel = tunnelResponse.data.tunnel || tunnelResponse.data;

    if (!tunnel || !tunnel.authentication?.saml) {
      return res.status(404).json({ error: 'SAML not configured for this tunnel' });
    }

    const config = tunnel.authentication.saml;
    
    // Generate SP metadata XML
    const metadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${config.issuer}">
  <SPSSODescriptor AuthnRequestsSigned="true" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${config.callbackUrl}" index="0"/>
  </SPSSODescriptor>
</EntityDescriptor>`;

    res.set('Content-Type', 'application/xml');
    res.send(metadata);
  } catch (error) {
    console.error('SAML metadata error:', error);
    res.status(500).json({ error: 'Failed to generate SAML metadata' });
  }
});

// SAML session verification endpoint
app.get('/auth/saml/verify', (req, res) => {
  const sessionId = req.cookies?.saml_session;
  
  if (!sessionId) {
    return res.status(401).json({ authenticated: false, error: 'No session' });
  }

  const result = samlHandler.verifySession(sessionId);
  
  if (result.valid) {
    res.json({ authenticated: true, user: result.user });
  } else {
    res.status(401).json({ authenticated: false, error: result.error });
  }
});

// SAML login redirect - initiates SAML flow
app.get('/auth/saml/login', async (req, res) => {
  try {
    const { tunnelId } = req.query;
    
    if (!tunnelId) {
      return res.status(400).json({ error: 'Missing tunnel ID' });
    }

    // Fetch tunnel from backend
    const tunnelResponse = await axios.get(`${BACKEND_URL}/api/tunnels/${tunnelId}`);
    const tunnel = tunnelResponse.data.tunnel || tunnelResponse.data;

    if (!tunnel || !tunnel.authentication?.saml) {
      return res.status(404).json({ error: 'SAML not configured for this tunnel' });
    }

    // Generate SAML login URL with tunnelId as RelayState
    const loginUrl = await samlHandler.generateLoginUrl(tunnel, tunnelId);
    
    res.redirect(loginUrl);
  } catch (error) {
    console.error('SAML login error:', error);
    res.status(500).json({ error: 'Failed to initiate SAML login', message: error.message });
  }
});

// SAML logout endpoint
app.post('/auth/saml/logout', async (req, res) => {
  try {
    const sessionId = req.cookies?.saml_session;
    const { tunnelId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'No active session' });
    }

    // Fetch tunnel from backend
    const tunnelResponse = await axios.get(`${BACKEND_URL}/api/tunnels/${tunnelId}`);
    const tunnel = tunnelResponse.data.tunnel || tunnelResponse.data;

    if (!tunnel || !tunnel.authentication?.saml) {
      // Just clear the cookie if tunnel not found
      res.clearCookie('saml_session');
      return res.json({ success: true, message: 'Session cleared' });
    }

    // Generate logout URL
    const logoutUrl = await samlHandler.generateLogoutUrl(tunnel, sessionId);
    
    res.clearCookie('saml_session');
    res.json({ success: true, logoutUrl });
  } catch (error) {
    console.error('SAML logout error:', error);
    res.clearCookie('saml_session');
    res.json({ success: true, message: 'Session cleared locally' });
  }
});

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
    path: req.url,
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
    
    // Update last request time for idle timeout tracking
    tunnel.lastRequestAt = Date.now();
    
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

// Tunnel timeout configuration (Industry Standard)
const TUNNEL_CONFIG = {
  // Heartbeat timeout: 5 minutes without heartbeat = stale connection
  HEARTBEAT_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  
  // Idle timeout: 2 hours without any request activity (industry standard)
  IDLE_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  
  // Max session duration: 24 hours (requires reconnect after)
  MAX_SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  
  // Cleanup interval: check every 60 seconds
  CLEANUP_INTERVAL: 60 * 1000 // 1 minute
};

// Cleanup stale connections every 60 seconds
setInterval(() => {
  const now = Date.now();

  for (const [subdomain, tunnel] of activeTunnels.entries()) {
    const lastHeartbeat = tunnel.lastHeartbeat || tunnel.connectedAt;
    const lastRequest = tunnel.lastRequestAt || tunnel.connectedAt;
    const sessionDuration = now - tunnel.connectedAt;
    
    // Check 1: No heartbeat for 5 minutes = connection lost
    if (now - lastHeartbeat > TUNNEL_CONFIG.HEARTBEAT_TIMEOUT) {
      console.log(`🔴 Removing tunnel (no heartbeat): ${subdomain}`);
      tunnel.ws.close();
      activeTunnels.delete(subdomain);
      rateLimiter.remove(subdomain);
      security.remove(subdomain);
      continue;
    }
    
    // Check 2: No request activity for 2 hours = idle timeout
    if (now - lastRequest > TUNNEL_CONFIG.IDLE_TIMEOUT) {
      console.log(`🟡 Removing tunnel (idle timeout - 2 hours): ${subdomain}`);
      tunnel.ws.send(JSON.stringify({ 
        type: 'timeout', 
        reason: 'idle',
        message: 'Tunnel closed due to 2 hours of inactivity. Reconnect to continue.'
      }));
      tunnel.ws.close();
      activeTunnels.delete(subdomain);
      rateLimiter.remove(subdomain);
      security.remove(subdomain);
      continue;
    }
    
    // Check 3: Session exceeded 24 hours = max duration
    if (sessionDuration > TUNNEL_CONFIG.MAX_SESSION_DURATION) {
      console.log(`🟠 Removing tunnel (max session - 24 hours): ${subdomain}`);
      tunnel.ws.send(JSON.stringify({ 
        type: 'timeout', 
        reason: 'max_session',
        message: 'Tunnel session expired after 24 hours. Please reconnect.'
      }));
      tunnel.ws.close();
      activeTunnels.delete(subdomain);
      rateLimiter.remove(subdomain);
      security.remove(subdomain);
      continue;
    }
  }
  
  // Cleanup rate limiter cache
  rateLimiter.cleanup();
}, TUNNEL_CONFIG.CLEANUP_INTERVAL);

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
