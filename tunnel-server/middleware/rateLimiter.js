// Simple in-memory rate limiter
// For production, use Redis for distributed rate limiting

class RateLimiter {
  constructor() {
    // Map: subdomain -> { requests: [], limit: number }
    this.limiters = new Map();
  }

  // Check if request is allowed
  isAllowed(subdomain, limit = 60) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    if (!this.limiters.has(subdomain)) {
      this.limiters.set(subdomain, {
        requests: [now],
        limit
      });
      return true;
    }

    const limiter = this.limiters.get(subdomain);
    
    // Remove requests older than 1 minute
    limiter.requests = limiter.requests.filter(time => time > oneMinuteAgo);

    // Check if limit exceeded
    if (limiter.requests.length >= limit) {
      return false;
    }

    // Add current request
    limiter.requests.push(now);
    return true;
  }

  // Update rate limit for a subdomain
  updateLimit(subdomain, newLimit) {
    if (this.limiters.has(subdomain)) {
      this.limiters.get(subdomain).limit = newLimit;
    }
  }

  // Get current request count
  getRequestCount(subdomain) {
    if (!this.limiters.has(subdomain)) {
      return 0;
    }
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const limiter = this.limiters.get(subdomain);
    
    // Clean old requests
    limiter.requests = limiter.requests.filter(time => time > oneMinuteAgo);
    
    return limiter.requests.length;
  }

  // Remove limiter for subdomain
  remove(subdomain) {
    this.limiters.delete(subdomain);
  }

  // Cleanup old limiters (run periodically)
  cleanup() {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000;

    for (const [subdomain, limiter] of this.limiters.entries()) {
      limiter.requests = limiter.requests.filter(time => time > fiveMinutesAgo);
      
      // Remove if no recent requests
      if (limiter.requests.length === 0) {
        this.limiters.delete(subdomain);
      }
    }
  }
}

module.exports = new RateLimiter();
