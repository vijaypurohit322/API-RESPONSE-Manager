require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./database');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const rateLimiter = require('./middleware/rateLimiter');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const socialAuthRoutes = require('./routes/socialAuth');
const deviceAuthRoutes = require('./routes/deviceAuth');
const projectRoutes = require('./routes/projects');
const responseRoutes = require('./routes/responses');
const commentRoutes = require('./routes/comments');
const tunnelRoutes = require('./routes/tunnels');
const webhookRoutes = require('./routes/webhooks');
const webhookReceiverRoutes = require('./routes/webhookReceiver');
const gdprRoutes = require('./routes/gdpr');

const app = express();
// Determine allowed origin(s)
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tunnelapi.in';
const allowedOrigins = [
  'https://tunnelapi.in',
  'https://www.tunnelapi.in',
  'http://localhost:5173',
  'http://localhost:8081',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8081'
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (e.g., curl, server-to-server)
    if (!origin) return callback(null, true);
    // allow configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In production, also allow tunnelapi.in and www.tunnelapi.in
    if (process.env.NODE_ENV === 'production') {
      if (origin.includes('tunnelapi.in')) return callback(null, true);
    }
    // otherwise block
    return callback(new Error('CORS policy: This origin is not allowed'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-auth-token'],
  exposedHeaders: ['Content-Length', 'X-Response-Time'],
  credentials: true, // <-- allow cookies / credentials; set to false if not using cookies
  optionsSuccessStatus: 204,
  maxAge: 600
};

connectDB();

// Security Headers (ISO 27001 A.14.1.2, OWASP A05:2021)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.tunnelapi.in", "wss://tunnel.tunnelapi.in"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for API responses
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
}));

app.use(cors(corsOptions));

// Handle preflight for all routes
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // Limit request body size (OWASP A05)

// Request logging middleware
app.use(requestLogger);

// Health check routes (no rate limiting)
app.use('/api/health', healthRoutes);

// Public routes (no auth, but with rate limiting)
// These must be defined before the global rate limiter
app.use('/api/projects/share', (req, res, next) => {
  // Apply a more lenient rate limit for share links
  const shareLimiter = rateLimiter.perIP({ 
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests to share link, please try again later'
  });
  shareLimiter(req, res, next);
});

// Global rate limiting for all other API routes
app.use('/api/', rateLimiter.global());

app.use('/api/auth', authRoutes);
app.use('/api/auth/social', socialAuthRoutes);
app.use('/api/auth/device', deviceAuthRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/tunnels', tunnelRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/webhook', webhookReceiverRoutes);
app.use('/api/gdpr', gdprRoutes); // GDPR compliance endpoints

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info('Server Started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Initialize graceful shutdown
const GracefulShutdown = require('./utils/gracefulShutdown');
const gracefulShutdown = new GracefulShutdown(server);
gracefulShutdown.init();

// Schedule cleanup job for inactive accounts (runs daily at 3 AM)
const { cleanupInactiveAccounts } = require('./jobs/cleanupInactiveAccounts');
const scheduleCleanup = () => {
  // Run cleanup daily at 3 AM
  const now = new Date();
  const next3AM = new Date(now);
  next3AM.setHours(3, 0, 0, 0);
  if (next3AM <= now) {
    next3AM.setDate(next3AM.getDate() + 1);
  }
  const msUntilNext = next3AM - now;
  
  setTimeout(() => {
    cleanupInactiveAccounts().catch(err => {
      logger.error('Scheduled cleanup failed', { error: err.message });
    });
    // Schedule next run in 24 hours
    setInterval(() => {
      cleanupInactiveAccounts().catch(err => {
        logger.error('Scheduled cleanup failed', { error: err.message });
      });
    }, 24 * 60 * 60 * 1000);
  }, msUntilNext);
  
  logger.info('Inactive account cleanup scheduled', { 
    nextRun: next3AM.toISOString(),
    inactiveDays: 15
  });
};

// Start cleanup scheduler in production
if (process.env.NODE_ENV === 'production') {
  scheduleCleanup();
}

// Error handling
app.use((err, req, res, next) => {
  logger.logError(err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userId: req.user?.id
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });
  
  // Exit process after logging
  process.exit(1);
});

module.exports = server;
