# Structured Logging

## Overview

Structured logging provides JSON-formatted logs for production environments and human-readable logs for development. Built with Winston, it enables powerful log aggregation, searching, and analysis.

---

## Features

### Log Levels

- **error** - Critical errors requiring immediate attention
- **warn** - Warning conditions that should be reviewed
- **info** - General informational messages
- **http** - HTTP request/response logs
- **debug** - Detailed debugging information

### Output Formats

**Development:**
```
2025-11-25 10:00:00 [info]: Server Started { port: 5000, environment: "development" }
```

**Production (JSON):**
```json
{
  "timestamp": "2025-11-25T10:00:00.000Z",
  "level": "info",
  "message": "Server Started",
  "port": 5000,
  "environment": "production"
}
```

### Log Files

- `logs/error.log` - Error level logs only
- `logs/combined.log` - All log levels
- Console output - Based on environment

---

## Usage

### Basic Logging

```javascript
const logger = require('./utils/logger');

// Info level
logger.info('User logged in', { userId: '123', email: 'user@example.com' });

// Warning level
logger.warn('Rate limit approaching', { userId: '123', remaining: 10 });

// Error level
logger.error('Database connection failed', { error: err.message });

// Debug level (development only)
logger.debug('Cache hit', { key: 'user:123', ttl: 3600 });
```

### HTTP Request Logging

```javascript
// Automatic logging via middleware
app.use(requestLogger);

// Manual logging
logger.logRequest(req, res, duration);
```

**Output:**
```json
{
  "timestamp": "2025-11-25T10:00:00.000Z",
  "level": "http",
  "message": "HTTP Request",
  "method": "GET",
  "url": "/api/projects",
  "status": 200,
  "duration": "45ms",
  "ip": "203.0.113.50",
  "userAgent": "Mozilla/5.0...",
  "userId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

### Authentication Events

```javascript
logger.logAuth('login', userId, {
  method: 'email',
  success: true,
  ip: req.ip
});

logger.logAuth('logout', userId);

logger.logAuth('password_reset', userId, {
  requestedBy: 'user',
  ip: req.ip
});
```

### Database Operations

```javascript
logger.logDB('create', 'projects', {
  projectId: project._id,
  userId: req.user.id,
  duration: 25
});

logger.logDB('query', 'users', {
  filter: { email: 'user@example.com' },
  duration: 10
});
```

### Tunnel Events

```javascript
logger.logTunnel('created', tunnelId, {
  subdomain: 'myapi',
  userId: req.user.id,
  protocol: 'https'
});

logger.logTunnel('connected', tunnelId, {
  localPort: 3000,
  publicUrl: 'https://myapi.tunnel.arm.dev'
});

logger.logTunnel('disconnected', tunnelId, {
  reason: 'client_closed',
  duration: 3600
});
```

### Webhook Events

```javascript
logger.logWebhook('received', webhookId, {
  source: 'github',
  event: 'push',
  deliveryId: 'abc123'
});

logger.logWebhook('delivered', webhookId, {
  destination: 'https://api.example.com/webhook',
  status: 200,
  duration: 150
});

logger.logWebhook('failed', webhookId, {
  destination: 'https://api.example.com/webhook',
  error: 'Connection timeout',
  retryCount: 3
});
```

### Security Events

```javascript
logger.logSecurity('rate_limit_exceeded', 'warning', {
  ip: req.ip,
  endpoint: '/api/login',
  limit: 5
});

logger.logSecurity('unauthorized_access', 'critical', {
  ip: req.ip,
  endpoint: '/api/admin',
  userId: req.user?.id
});

logger.logSecurity('ip_blocked', 'warning', {
  ip: req.ip,
  reason: 'blacklist',
  tunnelId: tunnel._id
});
```

### Performance Metrics

```javascript
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;

logger.logPerformance('database_query', duration, {
  collection: 'projects',
  operation: 'find',
  resultCount: 50
});

logger.logPerformance('api_call', duration, {
  service: 'github',
  endpoint: '/user',
  status: 200
});
```

### Error Logging

```javascript
try {
  // ... code ...
} catch (error) {
  logger.logError(error, {
    operation: 'create_project',
    userId: req.user.id,
    projectName: req.body.name
  });
  
  res.status(500).json({ error: 'Failed to create project' });
}
```

---

## Configuration

### Environment Variables

```env
# Log level (error, warn, info, http, debug)
LOG_LEVEL=info

# Node environment
NODE_ENV=production
```

### Log Level by Environment

- **Development:** `debug` (all logs)
- **Production:** `info` (info, warn, error)
- **Testing:** `error` (errors only)

### File Rotation

Log files automatically rotate when they reach 10MB:
- Maximum file size: 10MB
- Maximum files: 5
- Old files are compressed and archived

---

## Log Aggregation

### ELK Stack (Elasticsearch, Logstash, Kibana)

**Logstash Configuration:**
```ruby
input {
  file {
    path => "/app/logs/combined.log"
    codec => "json"
  }
}

filter {
  json {
    source => "message"
  }
  
  date {
    match => ["timestamp", "ISO8601"]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "arm-logs-%{+YYYY.MM.dd}"
  }
}
```

### Splunk

**Splunk Forwarder:**
```ini
[monitor:///app/logs/combined.log]
sourcetype = _json
index = arm-logs
```

### Datadog

```javascript
// Add Datadog transport
const { datadog } = require('winston-datadog');

logger.add(new datadog({
  apiKey: process.env.DATADOG_API_KEY,
  hostname: process.env.HOSTNAME,
  service: 'arm-backend',
  ddsource: 'nodejs'
}));
```

### CloudWatch

```javascript
// Add CloudWatch transport
const CloudWatchTransport = require('winston-cloudwatch');

logger.add(new CloudWatchTransport({
  logGroupName: '/aws/arm-backend',
  logStreamName: process.env.HOSTNAME,
  awsRegion: 'us-east-1'
}));
```

---

## Searching Logs

### Local Search (grep)

```bash
# Search for errors
grep '"level":"error"' logs/combined.log

# Search by user ID
grep '"userId":"60f7b3b3b3b3b3b3b3b3b3b3"' logs/combined.log

# Search for slow requests (>1000ms)
grep -E '"duration":"[0-9]{4,}ms"' logs/combined.log

# Search for specific date
grep '"timestamp":"2025-11-25' logs/combined.log
```

### jq (JSON Query)

```bash
# Get all errors
cat logs/combined.log | jq 'select(.level == "error")'

# Get errors for specific user
cat logs/combined.log | jq 'select(.userId == "60f7b3b3b3b3b3b3b3b3b3b3" and .level == "error")'

# Get slow requests
cat logs/combined.log | jq 'select(.duration and (.duration | tonumber) > 1000)'

# Count errors by type
cat logs/combined.log | jq -r 'select(.level == "error") | .message' | sort | uniq -c
```

### Elasticsearch Query

```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "level": "error" } },
        { "range": { "timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}
```

---

## Monitoring & Alerting

### Alert Rules

**High Error Rate:**
```javascript
// Alert if error rate > 10 per minute
SELECT COUNT(*) 
FROM logs 
WHERE level = 'error' 
AND timestamp > NOW() - INTERVAL 1 MINUTE
HAVING COUNT(*) > 10
```

**Slow Requests:**
```javascript
// Alert if p95 latency > 1000ms
SELECT PERCENTILE(duration, 95) 
FROM logs 
WHERE level = 'http' 
AND timestamp > NOW() - INTERVAL 5 MINUTE
HAVING PERCENTILE(duration, 95) > 1000
```

**Security Events:**
```javascript
// Alert on critical security events
SELECT * 
FROM logs 
WHERE message = 'Security Event' 
AND severity = 'critical'
```

### Grafana Dashboard

```json
{
  "panels": [
    {
      "title": "Error Rate",
      "targets": [
        {
          "expr": "rate(logs_total{level=\"error\"}[5m])"
        }
      ]
    },
    {
      "title": "Request Latency (p95)",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, logs_duration_bucket)"
        }
      ]
    }
  ]
}
```

---

## Best Practices

### 1. Use Appropriate Log Levels

```javascript
// ✅ Good
logger.info('User logged in', { userId: user.id });
logger.warn('Rate limit approaching', { remaining: 10 });
logger.error('Database connection failed', { error: err.message });

// ❌ Bad
logger.info('Database connection failed');  // Should be error
logger.error('User logged in');  // Should be info
```

### 2. Include Context

```javascript
// ✅ Good - includes context
logger.error('Failed to create project', {
  userId: req.user.id,
  projectName: req.body.name,
  error: err.message
});

// ❌ Bad - no context
logger.error('Failed to create project');
```

### 3. Don't Log Sensitive Data

```javascript
// ✅ Good
logger.info('User logged in', { userId: user.id });

// ❌ Bad - logs password
logger.info('User logged in', { 
  userId: user.id, 
  password: req.body.password  // NEVER LOG PASSWORDS
});
```

### 4. Use Structured Data

```javascript
// ✅ Good - structured
logger.info('Payment processed', {
  userId: user.id,
  amount: 99.99,
  currency: 'USD',
  transactionId: 'txn_123'
});

// ❌ Bad - unstructured
logger.info(`Payment of $99.99 processed for user ${user.id}`);
```

### 5. Log Performance Metrics

```javascript
// ✅ Good
const startTime = Date.now();
const result = await expensiveOperation();
logger.logPerformance('expensive_operation', Date.now() - startTime, {
  resultCount: result.length
});

// ❌ Bad - no performance tracking
const result = await expensiveOperation();
```

---

## Troubleshooting

### Problem: Logs not appearing

**Cause:** Log level too high

**Solution:**
```bash
# Set log level to debug
export LOG_LEVEL=debug

# Or in .env
LOG_LEVEL=debug
```

### Problem: Log files too large

**Cause:** Too much logging or no rotation

**Solution:**
```javascript
// Reduce log level in production
LOG_LEVEL=info

// Or increase rotation settings
new winston.transports.File({
  filename: 'logs/combined.log',
  maxsize: 5242880,  // 5MB
  maxFiles: 10
})
```

### Problem: Can't parse JSON logs

**Cause:** Mixed format logs

**Solution:**
```bash
# Filter only JSON lines
cat logs/combined.log | grep '^{' | jq '.'
```

### Problem: Performance impact

**Cause:** Too much logging

**Solution:**
```javascript
// Use debug level only in development
if (process.env.NODE_ENV === 'development') {
  logger.debug('Detailed info', { data });
}

// Or use sampling
if (Math.random() < 0.1) {  // Log 10% of requests
  logger.debug('Request details', { req });
}
```

---

## Examples

### Complete Request Flow

```javascript
// 1. Request received
logger.debug('Request Started', {
  method: req.method,
  url: req.url,
  ip: req.ip
});

// 2. Authentication
logger.logAuth('token_validated', userId, {
  tokenAge: 3600,
  ip: req.ip
});

// 3. Database query
const startTime = Date.now();
const projects = await Project.find({ userId });
logger.logDB('query', 'projects', {
  userId,
  resultCount: projects.length,
  duration: Date.now() - startTime
});

// 4. Response sent
logger.logRequest(req, res, Date.now() - requestStartTime);
```

### Error Handling

```javascript
try {
  const tunnel = await Tunnel.create(tunnelData);
  logger.logTunnel('created', tunnel._id, {
    subdomain: tunnel.subdomain,
    userId: req.user.id
  });
  res.json(tunnel);
} catch (error) {
  logger.logError(error, {
    operation: 'create_tunnel',
    userId: req.user.id,
    tunnelData
  });
  res.status(500).json({ error: 'Failed to create tunnel' });
}
```

---

## Performance Impact

- **CPU:** <1% overhead
- **Memory:** ~10MB for logger instance
- **Disk I/O:** Async writes, minimal impact
- **Latency:** <1ms per log entry

---

## References

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Structured Logging Best Practices](https://www.honeycomb.io/blog/structured-logging-and-your-team/)
- [ELK Stack](https://www.elastic.co/what-is/elk-stack)
- [Datadog Logging](https://docs.datadoghq.com/logs/)
