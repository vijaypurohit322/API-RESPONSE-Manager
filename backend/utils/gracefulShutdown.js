const logger = require('./logger');

/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of server, database, and other connections
 */
class GracefulShutdown {
  constructor(server) {
    this.server = server;
    this.isShuttingDown = false;
    this.connections = new Set();
    this.shutdownTimeout = 30000; // 30 seconds

    // Track active connections
    this.server.on('connection', (connection) => {
      this.connections.add(connection);
      connection.on('close', () => {
        this.connections.delete(connection);
      });
    });
  }

  /**
   * Initialize shutdown handlers
   */
  init() {
    // Handle SIGTERM (Docker, Kubernetes)
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, starting graceful shutdown');
      this.shutdown('SIGTERM');
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('SIGINT received, starting graceful shutdown');
      this.shutdown('SIGINT');
    });

    // Handle SIGUSR2 (nodemon restart)
    process.on('SIGUSR2', () => {
      logger.info('SIGUSR2 received, starting graceful shutdown');
      this.shutdown('SIGUSR2');
    });

    logger.info('Graceful shutdown handlers initialized');
  }

  /**
   * Perform graceful shutdown
   */
  async shutdown(signal) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info('Starting graceful shutdown', { signal });

    // Set timeout for forced shutdown
    const forceShutdownTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit', {
        timeout: this.shutdownTimeout
      });
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // Step 1: Stop accepting new connections
      logger.info('Closing server to new connections');
      await this.closeServer();

      // Step 2: Close active connections
      logger.info('Closing active connections', {
        count: this.connections.size
      });
      await this.closeConnections();

      // Step 3: Close database connections
      logger.info('Closing database connections');
      await this.closeDatabase();

      // Step 4: Close Redis connections
      logger.info('Closing Redis connections');
      await this.closeRedis();

      // Step 5: Cleanup other resources
      logger.info('Cleaning up resources');
      await this.cleanup();

      // Clear timeout
      clearTimeout(forceShutdownTimer);

      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', {
        error: error.message,
        stack: error.stack
      });
      clearTimeout(forceShutdownTimer);
      process.exit(1);
    }
  }

  /**
   * Close HTTP server
   */
  closeServer() {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          logger.error('Error closing server', { error: err.message });
          reject(err);
        } else {
          logger.info('Server closed successfully');
          resolve();
        }
      });
    });
  }

  /**
   * Close all active connections
   */
  async closeConnections() {
    const closePromises = Array.from(this.connections).map((connection) => {
      return new Promise((resolve) => {
        connection.end(() => {
          connection.destroy();
          resolve();
        });

        // Force close after 5 seconds
        setTimeout(() => {
          connection.destroy();
          resolve();
        }, 5000);
      });
    });

    await Promise.all(closePromises);
    logger.info('All connections closed', {
      count: closePromises.length
    });
  }

  /**
   * Close database connections
   */
  async closeDatabase() {
    try {
      const mongoose = require('mongoose');
      
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        logger.info('Database connection closed');
      } else {
        logger.info('Database already disconnected');
      }
    } catch (error) {
      logger.error('Error closing database', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Close Redis connections
   */
  async closeRedis() {
    try {
      const rateLimiter = require('../middleware/rateLimiter');
      
      if (rateLimiter.redisClient && rateLimiter.redisClient.isOpen) {
        await rateLimiter.close();
        logger.info('Redis connection closed');
      } else {
        logger.info('Redis not connected or already closed');
      }
    } catch (error) {
      logger.error('Error closing Redis', {
        error: error.message
      });
      // Don't throw - Redis is optional
    }
  }

  /**
   * Cleanup other resources
   */
  async cleanup() {
    // Close any open file handles
    // Clear intervals/timeouts
    // Flush logs
    
    // Give logger time to flush
    await new Promise(resolve => setTimeout(resolve, 100));
    
    logger.info('Cleanup completed');
  }

  /**
   * Get shutdown status
   */
  getStatus() {
    return {
      isShuttingDown: this.isShuttingDown,
      activeConnections: this.connections.size,
      uptime: process.uptime()
    };
  }
}

module.exports = GracefulShutdown;
