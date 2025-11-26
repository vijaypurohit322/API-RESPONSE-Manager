const ipaddr = require('ipaddr.js');

/**
 * IP Whitelist Middleware
 * Checks if the incoming request IP is allowed based on tunnel configuration
 */
class IPWhitelistMiddleware {
  /**
   * Check if IP is in whitelist
   * @param {string} ip - IP address to check
   * @param {Array} whitelist - Array of IP addresses or CIDR ranges
   * @returns {boolean}
   */
  static isIPAllowed(ip, whitelist) {
    if (!whitelist || whitelist.length === 0) {
      return true; // No whitelist means all IPs allowed
    }

    try {
      const addr = ipaddr.process(ip);

      for (const entry of whitelist) {
        // Check if entry is CIDR range
        if (entry.includes('/')) {
          const [range, bits] = entry.split('/');
          const rangeAddr = ipaddr.process(range);
          
          if (addr.kind() === rangeAddr.kind()) {
            const prefixLength = parseInt(bits, 10);
            if (addr.match(rangeAddr, prefixLength)) {
              return true;
            }
          }
        } else {
          // Direct IP comparison
          const allowedAddr = ipaddr.process(entry);
          if (addr.toString() === allowedAddr.toString()) {
            return true;
          }
        }
      }
    } catch (error) {
      console.error('IP whitelist check error:', error);
      return false;
    }

    return false;
  }

  /**
   * Check if IP is in blacklist
   * @param {string} ip - IP address to check
   * @param {Array} blacklist - Array of IP addresses or CIDR ranges
   * @returns {boolean}
   */
  static isIPBlocked(ip, blacklist) {
    if (!blacklist || blacklist.length === 0) {
      return false; // No blacklist means no IPs blocked
    }

    try {
      const addr = ipaddr.process(ip);

      for (const entry of blacklist) {
        if (entry.includes('/')) {
          const [range, bits] = entry.split('/');
          const rangeAddr = ipaddr.process(range);
          
          if (addr.kind() === rangeAddr.kind()) {
            const prefixLength = parseInt(bits, 10);
            if (addr.match(rangeAddr, prefixLength)) {
              return true;
            }
          }
        } else {
          const allowedAddr = ipaddr.process(entry);
          if (addr.toString() === allowedAddr.toString()) {
            return true;
          }
        }
      }
    } catch (error) {
      console.error('IP blacklist check error:', error);
      return false;
    }

    return false;
  }

  /**
   * Get client IP from request
   * Handles proxies and load balancers
   */
  static getClientIP(req) {
    // Check X-Forwarded-For header (from proxies)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return forwarded.split(',')[0].trim();
    }

    // Check X-Real-IP header (from nginx)
    if (req.headers['x-real-ip']) {
      return req.headers['x-real-ip'];
    }

    // Fallback to socket remote address
    return req.socket.remoteAddress || req.connection.remoteAddress;
  }

  /**
   * Express middleware factory
   * @param {Object} tunnel - Tunnel configuration with whitelist/blacklist
   */
  static middleware(tunnel) {
    return (req, res, next) => {
      const clientIP = this.getClientIP(req);

      // Check blacklist first (takes precedence)
      if (tunnel.ipBlacklist && this.isIPBlocked(clientIP, tunnel.ipBlacklist)) {
        console.warn(`Blocked IP: ${clientIP} for tunnel ${tunnel._id}`);
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Your IP address is blocked',
          ip: clientIP
        });
      }

      // Check whitelist
      if (tunnel.ipWhitelist && !this.isIPAllowed(clientIP, tunnel.ipWhitelist)) {
        console.warn(`Unauthorized IP: ${clientIP} for tunnel ${tunnel._id}`);
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Your IP address is not authorized',
          ip: clientIP
        });
      }

      // IP is allowed
      req.clientIP = clientIP;
      next();
    };
  }

  /**
   * Validate IP or CIDR format
   * @param {string} entry - IP address or CIDR range
   * @returns {boolean}
   */
  static isValidIPEntry(entry) {
    try {
      if (entry.includes('/')) {
        const [ip, bits] = entry.split('/');
        const addr = ipaddr.process(ip);
        const prefixLength = parseInt(bits, 10);
        
        // Validate prefix length
        if (addr.kind() === 'ipv4' && (prefixLength < 0 || prefixLength > 32)) {
          return false;
        }
        if (addr.kind() === 'ipv6' && (prefixLength < 0 || prefixLength > 128)) {
          return false;
        }
        
        return true;
      } else {
        ipaddr.process(entry);
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate array of IP entries
   * @param {Array} entries - Array of IP addresses or CIDR ranges
   * @returns {Object} - { valid: boolean, errors: Array }
   */
  static validateIPList(entries) {
    const errors = [];
    
    if (!Array.isArray(entries)) {
      return { valid: false, errors: ['IP list must be an array'] };
    }

    entries.forEach((entry, index) => {
      if (typeof entry !== 'string') {
        errors.push(`Entry at index ${index} must be a string`);
      } else if (!this.isValidIPEntry(entry)) {
        errors.push(`Invalid IP or CIDR format at index ${index}: ${entry}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = IPWhitelistMiddleware;
