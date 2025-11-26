const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

/**
 * Enhanced Rate Limiter Middleware
 * Supports per-IP, per-user, and per-tunnel rate limiting
 */
class RateLimiterMiddleware {
  constructor() {
    this.redisClient = null;
    this.useRedis = process.env.REDIS_URL ? true : false;

    if (this.useRedis) {
      try {
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                console.error('Redis connection failed after 10 retries');
                return new Error('Redis connection failed');
              }
              return retries * 100; // Exponential backoff
            }
          }
        });

        this.redisClient.on('error', (err) => {
          console.error('Redis error:', err);
        });

        this.redisClient.on('connect', () => {
          console.log('Redis connected for rate limiting');
        });

        this.redisClient.connect();
      } catch (error) {
        console.error('Failed to initialize Redis:', error);
        this.useRedis = false;
      }
    }
  }

  /**
   * Get client IP from request
   */
  getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (req.headers['x-real-ip']) {
      return req.headers['x-real-ip'];
    }
    return req.socket.remoteAddress || req.connection.remoteAddress;
  }

  /**
   * Per-IP rate limiter
   * Limits requests from a single IP address
   */
  perIP(options = {}) {
    const {
      windowMs = 60 * 1000, // 1 minute
      max = 100, // 100 requests per minute
      message = 'Too many requests from this IP, please try again later',
      skipSuccessfulRequests = false,
      skipFailedRequests = false
    } = options;

    const config = {
      windowMs,
      max,
      message: { error: 'Rate limit exceeded', message },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests,
      skipFailedRequests,
      keyGenerator: (req) => this.getClientIP(req),
      handler: (req, res) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message,
          retryAfter: Math.ceil(windowMs / 1000),
          limit: max,
          ip: this.getClientIP(req)
        });
      }
    };

    // Use Redis store if available
    if (this.useRedis && this.redisClient) {
      config.store = new RedisStore({
        client: this.redisClient,
        prefix: 'rl:ip:'
      });
    }

    return rateLimit(config);
  }

  /**
   * Per-user rate limiter
   * Limits requests from a single authenticated user
   */
  perUser(options = {}) {
    const {
      windowMs = 60 * 1000,
      max = 200,
      message = 'Too many requests from this user, please try again later',
      skipSuccessfulRequests = false,
      skipFailedRequests = false
    } = options;

    const config = {
      windowMs,
      max,
      message: { error: 'Rate limit exceeded', message },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests,
      skipFailedRequests,
      keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise fall back to IP
        return req.user?.id || this.getClientIP(req);
      },
      handler: (req, res) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message,
          retryAfter: Math.ceil(windowMs / 1000),
          limit: max,
          userId: req.user?.id
        });
      }
    };

    if (this.useRedis && this.redisClient) {
      config.store = new RedisStore({
        client: this.redisClient,
        prefix: 'rl:user:'
      });
    }

    return rateLimit(config);
  }

  /**
   * Per-tunnel rate limiter
   * Limits requests to a specific tunnel
   */
  perTunnel(tunnel) {
    if (!tunnel || !tunnel.rateLimit || !tunnel.rateLimit.enabled) {
      // No rate limiting configured, allow all requests
      return (req, res, next) => next();
    }

    const {
      requestsPerMinute = 60,
      requestsPerHour = 1000,
      requestsPerDay = 10000
    } = tunnel.rateLimit;

    // Create multiple limiters for different time windows
    const minuteLimiter = this.createTunnelLimiter(tunnel._id, {
      windowMs: 60 * 1000,
      max: requestsPerMinute,
      message: `Tunnel rate limit exceeded: ${requestsPerMinute} requests per minute`
    });

    const hourLimiter = this.createTunnelLimiter(tunnel._id, {
      windowMs: 60 * 60 * 1000,
      max: requestsPerHour || requestsPerMinute * 60,
      message: `Tunnel rate limit exceeded: ${requestsPerHour} requests per hour`
    });

    const dayLimiter = this.createTunnelLimiter(tunnel._id, {
      windowMs: 24 * 60 * 60 * 1000,
      max: requestsPerDay || requestsPerMinute * 60 * 24,
      message: `Tunnel rate limit exceeded: ${requestsPerDay} requests per day`
    });

    // Chain limiters
    return (req, res, next) => {
      minuteLimiter(req, res, (err) => {
        if (err) return next(err);
        hourLimiter(req, res, (err) => {
          if (err) return next(err);
          dayLimiter(req, res, next);
        });
      });
    };
  }

  /**
   * Create a tunnel-specific rate limiter
   */
  createTunnelLimiter(tunnelId, options) {
    const {
      windowMs,
      max,
      message
    } = options;

    const config = {
      windowMs,
      max,
      message: { error: 'Rate limit exceeded', message },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Combine tunnel ID with client IP for per-tunnel-per-IP limiting
        return `${tunnelId}:${this.getClientIP(req)}`;
      },
      handler: (req, res) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message,
          retryAfter: Math.ceil(windowMs / 1000),
          limit: max,
          tunnelId: tunnelId.toString(),
          ip: this.getClientIP(req)
        });
      }
    };

    if (this.useRedis && this.redisClient) {
      config.store = new RedisStore({
        client: this.redisClient,
        prefix: `rl:tunnel:${tunnelId}:`
      });
    }

    return rateLimit(config);
  }

  /**
   * Global API rate limiter
   * Protects all API endpoints
   */
  global(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 1000, // 1000 requests per 15 minutes
      message = 'Too many requests, please try again later'
    } = options;

    return this.perIP({ windowMs, max, message });
  }

  /**
   * Strict rate limiter for sensitive endpoints
   * (login, register, password reset)
   */
  strict(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 5, // 5 attempts per 15 minutes
      message = 'Too many attempts, please try again later'
    } = options;

    return this.perIP({ 
      windowMs, 
      max, 
      message,
      skipSuccessfulRequests: true // Only count failed attempts
    });
  }

  /**
   * Cleanup Redis connections
   */
  async close() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

// Export singleton instance
const rateLimiter = new RateLimiterMiddleware();

module.exports = rateLimiter;
