# Health Check Endpoints

## Overview

Health check endpoints provide monitoring and observability for API Response Manager. They're essential for load balancers, Kubernetes, and monitoring systems.

---

## Endpoints

### 1. Basic Health Check

**Endpoint:** `GET /api/health`

**Purpose:** Fast, lightweight check for load balancers

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-25T10:00:00.000Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

**Status Codes:**
- `200 OK` - Service is healthy

**Use Cases:**
- Load balancer health checks
- Quick status verification
- Uptime monitoring

---

### 2. Detailed Health Check

**Endpoint:** `GET /api/health/detailed`

**Purpose:** Comprehensive health status including dependencies

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-25T10:00:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "2.3.1",
  "checks": {
    "database": {
      "status": "ok",
      "state": "connected",
      "host": "localhost",
      "name": "api-response-manager"
    },
    "redis": {
      "status": "ok",
      "connected": true
    },
    "memory": {
      "status": "ok",
      "heapUsed": "150 MB",
      "heapTotal": "200 MB",
      "percentUsed": "75%",
      "rss": "250 MB",
      "external": "10 MB"
    },
    "disk": {
      "status": "ok",
      "message": "Disk check not implemented"
    }
  }
}
```

**Status Codes:**
- `200 OK` - All systems healthy
- `503 Service Unavailable` - One or more systems degraded

**Use Cases:**
- Monitoring dashboards
- Alerting systems
- Troubleshooting
- Capacity planning

---

### 3. Readiness Check

**Endpoint:** `GET /api/health/ready`

**Purpose:** Kubernetes readiness probe - is the service ready to accept traffic?

**Response (Ready):**
```json
{
  "status": "ready",
  "timestamp": "2025-11-25T10:00:00.000Z"
}
```

**Response (Not Ready):**
```json
{
  "status": "not ready",
  "reason": "Database not connected",
  "timestamp": "2025-11-25T10:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Ready to accept traffic
- `503 Service Unavailable` - Not ready

**Use Cases:**
- Kubernetes readiness probe
- Load balancer backend health
- Rolling deployments

---

### 4. Liveness Check

**Endpoint:** `GET /api/health/live`

**Purpose:** Kubernetes liveness probe - is the service alive?

**Response:**
```json
{
  "status": "alive",
  "timestamp": "2025-11-25T10:00:00.000Z",
  "uptime": 3600.5
}
```

**Status Codes:**
- `200 OK` - Service is alive

**Use Cases:**
- Kubernetes liveness probe
- Detect deadlocks or hangs
- Automatic restart triggers

---

### 5. Startup Check

**Endpoint:** `GET /api/health/startup`

**Purpose:** Kubernetes startup probe - has the service finished starting?

**Response (Started):**
```json
{
  "status": "started",
  "timestamp": "2025-11-25T10:00:00.000Z",
  "uptime": 10.5
}
```

**Response (Starting):**
```json
{
  "status": "starting",
  "timestamp": "2025-11-25T10:00:00.000Z",
  "uptime": 2.3
}
```

**Status Codes:**
- `200 OK` - Startup complete
- `503 Service Unavailable` - Still starting

**Use Cases:**
- Kubernetes startup probe
- Slow-starting applications
- Prevent premature traffic

---

### 6. Metrics Endpoint

**Endpoint:** `GET /api/health/metrics`

**Purpose:** Basic application metrics

**Response:**
```json
{
  "timestamp": "2025-11-25T10:00:00.000Z",
  "uptime": 3600.5,
  "memory": {
    "rss": 262144000,
    "heapTotal": 209715200,
    "heapUsed": 157286400,
    "external": 10485760
  },
  "cpu": {
    "user": 1234567,
    "system": 234567
  },
  "platform": "linux",
  "nodeVersion": "v18.17.0",
  "pid": 12345,
  "database": {
    "connected": true,
    "collections": 8,
    "dataSize": "150 MB",
    "storageSize": "200 MB",
    "indexes": 15,
    "indexSize": "25 MB"
  }
}
```

**Status Codes:**
- `200 OK` - Metrics available

**Use Cases:**
- Performance monitoring
- Resource usage tracking
- Capacity planning
- Debugging

---

## Kubernetes Configuration

### Deployment with Health Checks

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arm-backend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: backend
        image: arm-backend:2.3.1
        ports:
        - containerPort: 5000
        
        # Startup probe - allow 60 seconds for startup
        startupProbe:
          httpGet:
            path: /api/health/startup
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 12  # 60 seconds total
        
        # Liveness probe - restart if unhealthy
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        
        # Readiness probe - remove from load balancer if not ready
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
```

---

## Load Balancer Configuration

### nginx

```nginx
upstream backend {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}

server {
    location / {
        proxy_pass http://backend;
        
        # Health check
        health_check uri=/api/health interval=10s fails=3 passes=2;
    }
}
```

### HAProxy

```haproxy
backend arm_backend
    balance roundrobin
    option httpchk GET /api/health
    http-check expect status 200
    
    server backend1 backend1:5000 check inter 10s fall 3 rise 2
    server backend2 backend2:5000 check inter 10s fall 3 rise 2
    server backend3 backend3:5000 check inter 10s fall 3 rise 2
```

---

## Monitoring Integration

### Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'arm-backend'
    metrics_path: '/api/health/metrics'
    scrape_interval: 30s
    static_configs:
      - targets: ['backend:5000']
```

### Datadog

```javascript
// datadog-agent.yaml
init_config:

instances:
  - url: http://backend:5000/api/health/detailed
    name: arm_backend
    timeout: 5
    min_collection_interval: 30
```

### New Relic

```javascript
// newrelic.js
exports.config = {
  app_name: ['ARM Backend'],
  health_check_url: 'http://localhost:5000/api/health/detailed'
};
```

---

## Alerting Rules

### Prometheus Alert Rules

```yaml
groups:
  - name: arm_backend
    rules:
      # Service down
      - alert: BackendDown
        expr: up{job="arm-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Backend is down"
      
      # High memory usage
      - alert: HighMemoryUsage
        expr: arm_memory_percent_used > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memory usage above 80%"
      
      # Database disconnected
      - alert: DatabaseDisconnected
        expr: arm_database_connected == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection lost"
```

---

## Health Check Best Practices

### 1. Keep Basic Checks Fast

```javascript
// Good - fast check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Bad - slow check
app.get('/health', async (req, res) => {
  await checkAllDependencies();  // Too slow for load balancer
  res.json({ status: 'ok' });
});
```

### 2. Use Appropriate Timeouts

```yaml
# Kubernetes probe timeouts
startupProbe:
  timeoutSeconds: 3      # Fast
  failureThreshold: 12   # Allow time for startup

livenessProbe:
  timeoutSeconds: 3      # Fast
  failureThreshold: 3    # Restart quickly

readinessProbe:
  timeoutSeconds: 3      # Fast
  failureThreshold: 2    # Remove from LB quickly
```

### 3. Separate Concerns

- **Liveness:** Is the process alive? (minimal checks)
- **Readiness:** Can it handle traffic? (dependency checks)
- **Startup:** Has it finished initializing? (one-time checks)

### 4. Include Version Information

```json
{
  "status": "ok",
  "version": "2.3.1",
  "commit": "abc123",
  "buildDate": "2025-11-25"
}
```

### 5. Monitor Trends

Track health check metrics over time:
- Response times
- Failure rates
- Memory usage trends
- Database connection stability

---

## Troubleshooting

### Problem: Health check always returns 503

**Cause:** Database not connected

**Solution:**
```bash
# Check MongoDB connection
mongo --eval "db.adminCommand('ping')"

# Check environment variables
echo $MONGODB_URI

# Check logs
docker logs backend
```

### Problem: Readiness probe fails intermittently

**Cause:** Slow database queries

**Solution:**
```javascript
// Add timeout to database check
async function checkDatabase() {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 2000)
  );
  
  const check = mongoose.connection.db.admin().ping();
  
  return Promise.race([check, timeout]);
}
```

### Problem: Pod keeps restarting

**Cause:** Liveness probe failing

**Solution:**
```yaml
# Increase failure threshold
livenessProbe:
  failureThreshold: 5  # Allow more failures
  periodSeconds: 15    # Check less frequently
```

### Problem: High memory usage warning

**Cause:** Memory leak or high traffic

**Solution:**
```bash
# Check memory usage
curl http://backend:5000/api/health/detailed

# Take heap snapshot
node --inspect backend/server.js

# Restart if needed
kubectl rollout restart deployment/arm-backend
```

---

## Testing Health Checks

### Manual Testing

```bash
# Basic health check
curl http://localhost:5000/api/health

# Detailed health check
curl http://localhost:5000/api/health/detailed

# Readiness check
curl http://localhost:5000/api/health/ready

# Liveness check
curl http://localhost:5000/api/health/live

# Startup check
curl http://localhost:5000/api/health/startup

# Metrics
curl http://localhost:5000/api/health/metrics
```

### Automated Testing

```javascript
// health.test.js
describe('Health Checks', () => {
  it('should return 200 for basic health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should include all checks in detailed health', async () => {
    const res = await request(app).get('/api/health/detailed');
    expect(res.status).toBe(200);
    expect(res.body.checks).toHaveProperty('database');
    expect(res.body.checks).toHaveProperty('redis');
    expect(res.body.checks).toHaveProperty('memory');
  });

  it('should return 200 when ready', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });
});
```

---

## Performance Impact

### Response Times

- **Basic:** <5ms
- **Detailed:** <50ms (includes DB query)
- **Readiness:** <30ms (DB ping only)
- **Liveness:** <5ms (no external calls)
- **Startup:** <30ms
- **Metrics:** <20ms

### Resource Usage

- **CPU:** <0.1% per check
- **Memory:** Negligible
- **Network:** ~500 bytes per check

---

## References

- [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Health Check Pattern](https://microservices.io/patterns/observability/health-check-api.html)
- [Prometheus Monitoring](https://prometheus.io/docs/introduction/overview/)
