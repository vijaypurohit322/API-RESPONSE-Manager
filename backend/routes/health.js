const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * Health Check Routes
 * Provides detailed health status for monitoring and load balancers
 */

// Basic health check (fast, minimal checks)
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check (includes dependencies)
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '2.3.0',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      memory: checkMemory(),
      disk: checkDisk()
    }
  };

  // Determine overall status
  const allHealthy = Object.values(health.checks).every(check => check.status === 'ok');
  health.status = allHealthy ? 'ok' : 'degraded';

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

// Readiness check (for Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    // Check if database is connected
    const dbStatus = await checkDatabase();
    
    if (dbStatus.status === 'ok') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness check (for Kubernetes)
router.get('/live', (req, res) => {
  // Simple check - if server responds, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Startup check (for Kubernetes)
router.get('/startup', async (req, res) => {
  try {
    // Check if all critical services are initialized
    const dbStatus = await checkDatabase();
    
    const isStarted = dbStatus.status === 'ok' && process.uptime() > 5;
    
    if (isStarted) {
      res.status(200).json({
        status: 'started',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } else {
      res.status(503).json({
        status: 'starting',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'starting',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint (basic metrics)
router.get('/metrics', async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    pid: process.pid,
    database: await getDatabaseMetrics()
  };

  res.status(200).json(metrics);
});

// Helper functions

async function checkDatabase() {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (state === 1) {
      // Perform a simple query to verify connection
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'ok',
        state: states[state],
        host: mongoose.connection.host,
        name: mongoose.connection.name
      };
    } else {
      return {
        status: 'error',
        state: states[state],
        message: 'Database not connected'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
}

async function checkRedis() {
  try {
    // Check if Redis is configured
    if (!process.env.REDIS_URL) {
      return {
        status: 'not configured',
        message: 'Redis URL not set'
      };
    }

    // Try to get Redis client from rate limiter
    const rateLimiter = require('../middleware/rateLimiter');
    
    if (rateLimiter.redisClient && rateLimiter.redisClient.isOpen) {
      // Try a ping
      await rateLimiter.redisClient.ping();
      
      return {
        status: 'ok',
        connected: true
      };
    } else {
      return {
        status: 'error',
        connected: false,
        message: 'Redis client not connected'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
}

function checkMemory() {
  const usage = process.memoryUsage();
  const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const percentUsed = Math.round((usage.heapUsed / usage.heapTotal) * 100);

  // Warning if memory usage > 80%
  const status = percentUsed > 80 ? 'warning' : 'ok';

  return {
    status,
    heapUsed: `${usedMB} MB`,
    heapTotal: `${totalMB} MB`,
    percentUsed: `${percentUsed}%`,
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`
  };
}

function checkDisk() {
  // Basic disk check (requires additional package for detailed info)
  // For now, just return ok
  return {
    status: 'ok',
    message: 'Disk check not implemented'
  };
}

async function getDatabaseMetrics() {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { connected: false };
    }

    const db = mongoose.connection.db;
    const stats = await db.stats();

    return {
      connected: true,
      collections: stats.collections,
      dataSize: `${Math.round(stats.dataSize / 1024 / 1024)} MB`,
      storageSize: `${Math.round(stats.storageSize / 1024 / 1024)} MB`,
      indexes: stats.indexes,
      indexSize: `${Math.round(stats.indexSize / 1024 / 1024)} MB`
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

module.exports = router;
