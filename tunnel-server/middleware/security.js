const crypto = require('crypto');

class SecurityMiddleware {
  constructor() {
    // IP whitelist cache: subdomain -> Set of allowed IPs
    this.ipWhitelists = new Map();
    
    // Authentication cache: subdomain -> { type, credentials }
    this.authConfig = new Map();
  }

  // Set IP whitelist for a subdomain
  setIPWhitelist(subdomain, ipList) {
    this.ipWhitelists.set(subdomain, new Set(ipList));
  }

  // Check if IP is whitelisted
  isIPAllowed(subdomain, clientIP) {
    if (!this.ipWhitelists.has(subdomain)) {
      return true; // No whitelist = allow all
    }

    const whitelist = this.ipWhitelists.get(subdomain);
    if (whitelist.size === 0) {
      return true; // Empty whitelist = allow all
    }

    // Check exact match or CIDR range (simplified)
    return whitelist.has(clientIP) || this.checkCIDR(clientIP, whitelist);
  }

  // Simple CIDR check (for basic ranges like 192.168.1.0/24)
  checkCIDR(ip, whitelist) {
    for (const range of whitelist) {
      if (range.includes('/')) {
        const [network, bits] = range.split('/');
        const mask = -1 << (32 - parseInt(bits));
        
        const ipNum = this.ipToNumber(ip);
        const networkNum = this.ipToNumber(network);
        
        if ((ipNum & mask) === (networkNum & mask)) {
          return true;
        }
      }
    }
    return false;
  }

  // Convert IP to number for CIDR comparison
  ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  }

  // Set authentication config
  setAuthentication(subdomain, config) {
    this.authConfig.set(subdomain, config);
  }

  // Check authentication
  checkAuthentication(subdomain, req) {
    if (!this.authConfig.has(subdomain)) {
      return { allowed: true }; // No auth required
    }

    const config = this.authConfig.get(subdomain);
    
    if (!config.enabled) {
      return { allowed: true };
    }

    switch (config.type) {
      case 'basic':
        return this.checkBasicAuth(req, config);
      
      case 'token':
        return this.checkTokenAuth(req, config);
      
      default:
        return { allowed: true };
    }
  }

  // Check Basic Authentication
  checkBasicAuth(req, config) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return {
        allowed: false,
        statusCode: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Tunnel Access"' },
        message: 'Authentication required'
      };
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (username === config.username && password === config.password) {
      return { allowed: true };
    }

    return {
      allowed: false,
      statusCode: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Tunnel Access"' },
      message: 'Invalid credentials'
    };
  }

  // Check Token Authentication
  checkTokenAuth(req, config) {
    const token = req.headers['x-tunnel-token'] || req.query.token;

    if (!token) {
      return {
        allowed: false,
        statusCode: 401,
        message: 'Token required'
      };
    }

    if (token === config.token) {
      return { allowed: true };
    }

    return {
      allowed: false,
      statusCode: 401,
      message: 'Invalid token'
    };
  }

  // Remove security config for subdomain
  remove(subdomain) {
    this.ipWhitelists.delete(subdomain);
    this.authConfig.delete(subdomain);
  }

  // Validate request headers for security
  validateHeaders(req) {
    // Block potentially dangerous headers
    const dangerousHeaders = ['x-forwarded-host', 'x-original-url'];
    
    for (const header of dangerousHeaders) {
      if (req.headers[header]) {
        delete req.headers[header];
      }
    }

    return true;
  }

  // Generate secure token
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new SecurityMiddleware();
