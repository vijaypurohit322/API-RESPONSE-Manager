const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * ISO 27001 / OWASP compliant authentication
 * 
 * Security features:
 * - JWT token validation with expiry check
 * - Token format validation
 * - Secure error messages (no information leakage)
 * - Request logging for audit trail
 */
module.exports = function (req, res, next) {
  // Get token from header (supports both x-auth-token and Authorization: Bearer)
  let token = req.header('x-auth-token');
  
  // Also check Authorization header (Bearer token)
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Security: No token provided
  if (!token) {
    return res.status(401).json({ 
      msg: 'Authentication required',
      error: 'No authentication token provided'
    });
  }

  // Security: Validate token format (JWT has 3 parts separated by dots)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    return res.status(401).json({ 
      msg: 'Invalid token format',
      error: 'Token must be a valid JWT'
    });
  }

  // Security: Validate JWT_SECRET is configured
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('SECURITY WARNING: JWT_SECRET is not properly configured');
    return res.status(500).json({ 
      msg: 'Server configuration error',
      error: 'Authentication service unavailable'
    });
  }

  try {
    // Verify token with secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // Only allow HS256 algorithm
      maxAge: '7d' // Token max age
    });

    // Security: Validate decoded payload has required fields
    if (!decoded.user || !decoded.user.id) {
      return res.status(401).json({ 
        msg: 'Invalid token payload',
        error: 'Token does not contain valid user information'
      });
    }

    // Attach user to request
    req.user = decoded.user;
    
    // Add token info for audit logging
    req.tokenInfo = {
      issuedAt: decoded.iat,
      expiresAt: decoded.exp
    };

    next();
  } catch (err) {
    // Security: Handle specific JWT errors without leaking information
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        msg: 'Token expired',
        error: 'Please login again to continue'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        msg: 'Invalid token',
        error: 'Authentication failed'
      });
    }

    // Generic error (don't leak internal details)
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ 
      msg: 'Authentication failed',
      error: 'Unable to verify authentication'
    });
  }
};
