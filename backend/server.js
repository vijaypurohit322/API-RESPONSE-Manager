require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use(requestLogger);

// Health check routes (no rate limiting)
app.use('/api/health', healthRoutes);

// Global rate limiting
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
