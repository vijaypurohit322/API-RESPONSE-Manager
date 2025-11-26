const winston = require('winston');
const path = require('path');

/**
 * Structured Logger using Winston
 * Provides JSON-formatted logs for production and human-readable logs for development
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Determine log level from environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format for development (human-readable)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, ...meta } = info;
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    }
  )
);

// Define log format for production (JSON)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine format based on environment
const format = process.env.NODE_ENV === 'production' ? prodFormat : devFormat;

// Define transports
const transports = [
  // Console output
  new winston.transports.Console({
    format: format
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: prodFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: prodFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper methods for structured logging

/**
 * Log HTTP request
 */
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id
  };

  if (res.statusCode >= 500) {
    logger.error('HTTP Request Error', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('HTTP Request Warning', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

/**
 * Log authentication events
 */
logger.logAuth = (event, userId, details = {}) => {
  logger.info('Authentication Event', {
    event,
    userId,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log database operations
 */
logger.logDB = (operation, collection, details = {}) => {
  logger.debug('Database Operation', {
    operation,
    collection,
    ...details
  });
};

/**
 * Log tunnel events
 */
logger.logTunnel = (event, tunnelId, details = {}) => {
  logger.info('Tunnel Event', {
    event,
    tunnelId,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log webhook events
 */
logger.logWebhook = (event, webhookId, details = {}) => {
  logger.info('Webhook Event', {
    event,
    webhookId,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log security events
 */
logger.logSecurity = (event, severity, details = {}) => {
  const logLevel = severity === 'critical' ? 'error' : 'warn';
  logger[logLevel]('Security Event', {
    event,
    severity,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log performance metrics
 */
logger.logPerformance = (operation, duration, details = {}) => {
  logger.debug('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...details
  });
};

/**
 * Log error with context
 */
logger.logError = (error, context = {}) => {
  logger.error('Error', {
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString()
  });
};

// Stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;
