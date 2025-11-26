const logger = require('../utils/logger');

/**
 * Request Logger Middleware
 * Logs all HTTP requests with timing and metadata
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request start
  logger.debug('Request Started', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;
    
    const duration = Date.now() - startTime;
    
    // Log request completion
    logger.logRequest(req, res, duration);
    
    return res.send(data);
  };

  next();
};

module.exports = requestLogger;
