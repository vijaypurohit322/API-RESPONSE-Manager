const net = require('net');
const EventEmitter = require('events');

class TCPTunnel extends EventEmitter {
  constructor(tunnel, wsConnection) {
    super();
    this.tunnel = tunnel;
    this.wsConnection = wsConnection;
    this.tcpServer = null;
    this.connections = new Map();
  }

  start() {
    return new Promise((resolve, reject) => {
      this.tcpServer = net.createServer((socket) => {
        this.handleConnection(socket);
      });

      this.tcpServer.on('error', (error) => {
        console.error(`TCP Server error for tunnel ${this.tunnel.subdomain}:`, error);
        this.emit('error', error);
        reject(error);
      });

      this.tcpServer.listen(this.tunnel.localPort, () => {
        console.log(`TCP tunnel listening on port ${this.tunnel.localPort}`);
        this.emit('started');
        resolve();
      });
    });
  }

  handleConnection(socket) {
    const connectionId = `tcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.connections.set(connectionId, socket);

    console.log(`New TCP connection: ${connectionId}`);

    // Send connection event to client via WebSocket
    this.wsConnection.send(JSON.stringify({
      type: 'tcp-connection',
      connectionId,
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort
    }));

    // Forward data from TCP socket to WebSocket
    socket.on('data', (data) => {
      if (this.wsConnection.readyState === 1) { // OPEN
        this.wsConnection.send(JSON.stringify({
          type: 'tcp-data',
          connectionId,
          data: data.toString('base64')
        }));
      }
    });

    socket.on('end', () => {
      console.log(`TCP connection ended: ${connectionId}`);
      this.wsConnection.send(JSON.stringify({
        type: 'tcp-end',
        connectionId
      }));
      this.connections.delete(connectionId);
    });

    socket.on('error', (error) => {
      console.error(`TCP socket error for ${connectionId}:`, error);
      this.connections.delete(connectionId);
    });

    // Handle data from WebSocket (client response)
    this.wsConnection.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'tcp-response' && data.connectionId === connectionId) {
          const buffer = Buffer.from(data.data, 'base64');
          socket.write(buffer);
        }
        
        if (data.type === 'tcp-close' && data.connectionId === connectionId) {
          socket.end();
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
  }

  stop() {
    return new Promise((resolve) => {
      // Close all active connections
      this.connections.forEach((socket, connectionId) => {
        socket.end();
        this.connections.delete(connectionId);
      });

      if (this.tcpServer) {
        this.tcpServer.close(() => {
          console.log(`TCP tunnel stopped for ${this.tunnel.subdomain}`);
          this.emit('stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getStats() {
    return {
      activeConnections: this.connections.size,
      port: this.tunnel.localPort
    };
  }
}

module.exports = TCPTunnel;
