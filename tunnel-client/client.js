#!/usr/bin/env node

const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const axios = require('axios');

class TunnelClient {
  constructor(options) {
    this.tunnelId = options.tunnelId;
    this.subdomain = options.subdomain;
    this.localPort = options.localPort;
    this.authToken = options.authToken;
    this.userId = options.userId;
    this.tunnelServerUrl = options.tunnelServerUrl || 'ws://localhost:9000';
    this.localHost = options.localHost || 'localhost';
    
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
  }

  connect() {
    console.log('🔌 Connecting to tunnel server...');
    
    this.ws = new WebSocket(this.tunnelServerUrl);

    this.ws.on('open', () => {
      console.log('✅ Connected to tunnel server');
      this.reconnectAttempts = 0;
      this.register();
      this.startHeartbeat();
    });

    this.ws.on('message', (data) => {
      this.handleMessage(data);
    });

    this.ws.on('close', () => {
      console.log('❌ Disconnected from tunnel server');
      this.stopHeartbeat();
      this.attemptReconnect();
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
    });
  }

  register() {
    const registrationData = {
      type: 'register',
      tunnelId: this.tunnelId,
      subdomain: this.subdomain,
      userId: this.userId,
      localPort: this.localPort,
      authToken: this.authToken
    };

    this.ws.send(JSON.stringify(registrationData));
    console.log(`📡 Registering tunnel: ${this.subdomain}`);
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'registered':
          this.handleRegistered(message);
          break;

        case 'request':
          this.handleRequest(message);
          break;

        case 'heartbeat_ack':
          // Heartbeat acknowledged
          break;

        case 'error':
          console.error('❌ Tunnel error:', message.message);
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  handleRegistered(message) {
    console.log('='.repeat(60));
    console.log('🎉 Tunnel Active!');
    console.log('='.repeat(60));
    console.log(`Public URL:  ${message.publicUrl}`);
    console.log(`Local Port:  ${this.localPort}`);
    console.log(`Subdomain:   ${message.subdomain}`);
    console.log('='.repeat(60));
    console.log('Forwarding requests to your local server...');
    console.log('Press Ctrl+C to stop the tunnel');
    console.log('='.repeat(60));
  }

  async handleRequest(message) {
    const { requestId, method, url, headers, body } = message;

    console.log(`📥 ${method} ${url}`);

    try {
      // Forward request to local server
      const localUrl = `http://${this.localHost}:${this.localPort}${url}`;
      
      const response = await axios({
        method: method.toLowerCase(),
        url: localUrl,
        headers: headers,
        data: body,
        validateStatus: () => true, // Accept any status code
        maxRedirects: 0
      });

      // Send response back through tunnel
      this.sendResponse(requestId, {
        statusCode: response.status,
        headers: response.headers,
        body: response.data
      });

      console.log(`📤 ${response.status} ${method} ${url}`);
    } catch (error) {
      console.error(`❌ Error forwarding request: ${error.message}`);
      console.error('Error details:', error.code, error.response?.status, error.response?.statusText);
      
      // Send error response
      this.sendError(requestId, error.message);
    }
  }

  sendResponse(requestId, responseData) {
    const message = {
      type: 'response',
      requestId,
      statusCode: responseData.statusCode,
      headers: responseData.headers,
      body: responseData.body
    };

    this.ws.send(JSON.stringify(message));
  }

  sendError(requestId, error) {
    const message = {
      type: 'error',
      requestId,
      error
    };

    this.ws.send(JSON.stringify(message));
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 15000); // Every 15 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Exiting...');
      process.exit(1);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnecting in ${delay / 1000}s... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    console.log('🛑 Stopping tunnel...');
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 5) {
    console.log('Usage: node client.js <tunnelId> <subdomain> <localPort> <authToken> <userId>');
    process.exit(1);
  }

  const [tunnelId, subdomain, localPort, authToken, userId] = args;

  const client = new TunnelClient({
    tunnelId,
    subdomain,
    localPort: parseInt(localPort),
    authToken,
    userId,
    tunnelServerUrl: process.env.TUNNEL_SERVER_URL || 'ws://localhost:9000'
  });

  client.connect();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n');
    client.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    client.disconnect();
    process.exit(0);
  });
}

module.exports = TunnelClient;
