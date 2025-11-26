# Rate Limiting

## Overview

Rate limiting protects your API and tunnels from abuse, DDoS attacks, and excessive usage. ARM supports multiple types of rate limiting with Redis-backed persistence.

---

## Features

### Multi-Level Rate Limiting

1. **Global Rate Limiting** - Protects all API endpoints
2. **Per-IP Rate Limiting** - Limits requests from a single IP
3. **Per-User Rate Limiting** - Limits requests from authenticated users
4. **Per-Tunnel Rate Limiting** - Limits requests to specific tunnels
5. **Strict Rate Limiting** - Extra protection for sensitive endpoints (login, register)

### Redis Support

- **In-Memory** - Fast, but resets on server restart
- **Redis-Backed** - Persistent, distributed across multiple servers
- **Automatic Fallback** - Uses in-memory if Redis unavailable

---

## Configuration

### Environment Variables

```env
# Redis URL (optional - enables distributed rate limiting)
REDIS_URL=redis://localhost:6379

# Or with authentication
REDIS_URL=redis://username:password@localhost:6379

# Or Redis Cloud
REDIS_URL=redis://default:password@redis-12345.cloud.redislabs.com:12345
```

### Without Redis

Rate limiting works without Redis using in-memory storage. However:
- ❌ Limits reset on server restart
- ❌ Not shared across multiple server instances
- ❌ Higher memory usage

### With Redis

- ✅ Persistent limits across restarts
- ✅ Shared across multiple servers
- ✅ Lower memory usage
- ✅ Better performance at scale

---

## Rate Limit Types

### 1. Global Rate Limiting

Applied to all `/api/*` endpoints.

**Default:** 1000 requests per 15 minutes per IP

```javascript
// Automatically applied in server.js
app.use('/api/', rateLimiter.global());
```

**Custom Configuration:**
```javascript
app.use('/api/', rateLimiter.global({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 1000,                  // 1000 requests
  message: 'Too many requests'
}));
```

### 2. Per-IP Rate Limiting

Limits requests from a single IP address.

**Usage:**
```javascript
router.get('/endpoint', rateLimiter.perIP({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,              // 100 requests
  message: 'Too many requests from this IP'
}), handler);
```

**Features:**
- Handles proxies (X-Forwarded-For, X-Real-IP)
- Supports IPv4 and IPv6
- Returns 429 status with retry-after header

### 3. Per-User Rate Limiting

Limits requests from authenticated users.

**Usage:**
```javascript
router.get('/endpoint', auth, rateLimiter.perUser({
  windowMs: 60 * 1000,  // 1 minute
  max: 200,              // 200 requests
  message: 'Too many requests from this user'
}), handler);
```

**Features:**
- Uses user ID from JWT token
- Falls back to IP if not authenticated
- Higher limits than per-IP

### 4. Per-Tunnel Rate Limiting

Limits requests to a specific tunnel based on tunnel configuration.

**Tunnel Configuration:**
```json
{
  "rateLimit": {
    "enabled": true,
    "requestsPerMinute": 60,
    "requestsPerHour": 1000,
    "requestsPerDay": 10000
  }
}
```

**Usage:**
```javascript
// In tunnel proxy handler
const tunnel = await Tunnel.findById(tunnelId);
app.use(rateLimiter.perTunnel(tunnel));
```

**Features:**
- Multiple time windows (minute, hour, day)
- Per-tunnel-per-IP limiting
- Configurable per tunnel
- Can be disabled per tunnel

### 5. Strict Rate Limiting

Extra protection for sensitive endpoints (login, register, password reset).

**Usage:**
```javascript
router.post('/login', rateLimiter.strict({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  message: 'Too many login attempts'
}), loginHandler);
```

**Features:**
- Very low limits (5-10 requests)
- Longer time windows (15 minutes)
- Only counts failed requests (optional)

---

## API Reference

### Update Tunnel Rate Limits

```http
PUT /api/tunnels/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "rateLimit": {
    "enabled": true,
    "requestsPerMinute": 100,
    "requestsPerHour": 5000,
    "requestsPerDay": 50000
  }
}
```

### Response Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Error Response (429 Too Many Requests)

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests from this IP, please try again later",
  "retryAfter": 60,
  "limit": 100,
  "ip": "203.0.113.50"
}
```

---

## Examples

### Example 1: Protect Login Endpoint

```javascript
const rateLimiter = require('./middleware/rateLimiter');

router.post('/login', 
  rateLimiter.strict({ 
    max: 5, 
    windowMs: 15 * 60 * 1000,
    skipSuccessfulRequests: true  // Only count failed logins
  }), 
  loginHandler
);
```

### Example 2: API with Different Limits

```javascript
// Public endpoints - strict limits
router.get('/public', rateLimiter.perIP({ max: 100 }), handler);

// Authenticated endpoints - higher limits
router.get('/private', auth, rateLimiter.perUser({ max: 1000 }), handler);
```

### Example 3: Tunnel with Custom Limits

```javascript
// Create tunnel with rate limits
const tunnel = await Tunnel.create({
  subdomain: 'myapi',
  localPort: 3000,
  rateLimit: {
    enabled: true,
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000
  }
});

// Apply rate limiting to tunnel
app.use(`/${tunnel.subdomain}`, rateLimiter.perTunnel(tunnel));
```

### Example 4: Disable Rate Limiting for Specific Tunnel

```javascript
const tunnel = await Tunnel.findById(tunnelId);
tunnel.rateLimit.enabled = false;
await tunnel.save();
```

---

## Redis Setup

### Local Development

```bash
# Install Redis
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows (WSL or Docker)
docker run -d -p 6379:6379 redis:alpine
```

### Production (Redis Cloud)

1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a database
3. Copy connection URL
4. Set `REDIS_URL` environment variable

```env
REDIS_URL=redis://default:password@redis-12345.cloud.redislabs.com:12345
```

### Docker Compose

```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  backend:
    environment:
      - REDIS_URL=redis://redis:6379

volumes:
  redis-data:
```

---

## Monitoring

### Check Rate Limit Status

```bash
# Check Redis keys
redis-cli KEYS "rl:*"

# Check specific IP
redis-cli GET "rl:ip:203.0.113.50"

# Check user
redis-cli GET "rl:user:60f7b3b3b3b3b3b3b3b3b3b3"

# Check tunnel
redis-cli GET "rl:tunnel:60f7b3b3b3b3b3b3b3b3b3b3:203.0.113.50"
```

### Rate Limit Metrics

Track rate limit hits in your monitoring system:

```javascript
// Log rate limit hits
rateLimiter.perIP({
  max: 100,
  handler: (req, res) => {
    // Log to monitoring system
    console.log('Rate limit hit:', {
      ip: req.ip,
      path: req.path,
      timestamp: new Date()
    });
    
    res.status(429).json({ error: 'Rate limit exceeded' });
  }
});
```

---

## Best Practices

### 1. Layer Your Limits

Use multiple rate limiting layers:

```javascript
// Global protection
app.use('/api/', rateLimiter.global());

// Endpoint-specific protection
router.post('/login', rateLimiter.strict(), loginHandler);
router.get('/data', auth, rateLimiter.perUser(), dataHandler);
```

### 2. Set Appropriate Limits

- **Public APIs:** 100-1000 requests/minute
- **Authenticated APIs:** 1000-10000 requests/minute
- **Login/Register:** 5-10 attempts/15 minutes
- **Tunnels:** Based on expected traffic

### 3. Use Redis in Production

Always use Redis in production for:
- Distributed rate limiting
- Persistent limits
- Better performance

### 4. Monitor and Adjust

- Track 429 errors
- Adjust limits based on usage patterns
- Whitelist known good actors
- Blacklist abusers

### 5. Provide Clear Error Messages

```javascript
{
  error: 'Rate limit exceeded',
  message: 'Too many requests. Please try again in 60 seconds.',
  retryAfter: 60,
  limit: 100,
  documentation: 'https://docs.arm.dev/rate-limiting'
}
```

---

## Troubleshooting

### Problem: Rate limits not working

**Cause:** Redis not connected or middleware not applied

**Solution:**
```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# Check backend logs
# Should see: "Redis connected for rate limiting"
```

### Problem: Limits reset on server restart

**Cause:** Using in-memory storage (Redis not configured)

**Solution:** Set `REDIS_URL` environment variable

### Problem: Too many 429 errors

**Cause:** Limits too strict for legitimate traffic

**Solution:** Increase limits or use per-user instead of per-IP

```javascript
// Before (too strict)
rateLimiter.perIP({ max: 10 })

// After (more reasonable)
rateLimiter.perUser({ max: 1000 })
```

### Problem: Rate limits not shared across servers

**Cause:** Each server has its own in-memory storage

**Solution:** Use Redis for distributed rate limiting

---

## Advanced Configuration

### Skip Successful Requests

Only count failed requests (useful for login):

```javascript
rateLimiter.strict({
  max: 5,
  skipSuccessfulRequests: true  // Only count 401/403 responses
})
```

### Custom Key Generator

Rate limit by custom criteria:

```javascript
rateLimiter.perIP({
  keyGenerator: (req) => {
    // Rate limit by API key instead of IP
    return req.headers['x-api-key'] || req.ip;
  }
})
```

### Dynamic Limits

Adjust limits based on user tier:

```javascript
const getDynamicLimit = (req) => {
  if (req.user?.tier === 'premium') return 10000;
  if (req.user?.tier === 'pro') return 5000;
  return 1000;
};

router.get('/api/data', auth, (req, res, next) => {
  const limiter = rateLimiter.perUser({ 
    max: getDynamicLimit(req) 
  });
  limiter(req, res, next);
}, handler);
```

---

## CLI Commands

```bash
# Set tunnel rate limits
arm tunnel:rate-limit <tunnel-id> --rpm 100 --rph 5000 --rpd 50000

# Disable rate limiting
arm tunnel:rate-limit <tunnel-id> --disable

# Enable rate limiting
arm tunnel:rate-limit <tunnel-id> --enable

# View current limits
arm tunnel:get <tunnel-id>
```

---

## Integration with Other Features

### With IP Whitelisting

Combine rate limiting with IP whitelisting:

```javascript
// Apply both middlewares
app.use(ipWhitelist.middleware(tunnel));
app.use(rateLimiter.perTunnel(tunnel));
```

### With Authentication

Higher limits for authenticated users:

```javascript
router.get('/data',
  auth,  // Authenticate first
  rateLimiter.perUser({ max: 1000 }),  // Higher limit
  handler
);
```

---

## Performance Impact

### Without Redis
- **Memory:** ~1KB per unique IP/user
- **CPU:** Minimal (<1% overhead)
- **Latency:** <1ms per request

### With Redis
- **Memory:** Minimal (stored in Redis)
- **CPU:** Minimal (<1% overhead)
- **Latency:** ~2-5ms per request (Redis lookup)
- **Network:** ~100 bytes per request

---

## References

- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
- [rate-limit-redis](https://github.com/wyattjoh/rate-limit-redis)
- [Redis Documentation](https://redis.io/docs/)
- [HTTP 429 Status Code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
