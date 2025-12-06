---
sidebar_position: 4
title: Scaling
description: Scale TunnelAPI for production
---

# Scaling Guide

## Horizontal Scaling

### Backend API

Scale backend instances:

```bash
docker compose up -d --scale backend=3
```

Use Nginx upstream for load balancing:

```nginx
upstream backend {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}
```

### Tunnel Server

For high tunnel volume, run multiple tunnel servers with sticky sessions.

## Database Scaling

### MongoDB Replica Set

For production, use a MongoDB replica set:

```bash
# Or use MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tunnelapi
```

## Caching

Add Redis for session caching:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## Monitoring

### Health Checks

```bash
curl https://api.yourdomain.com/health
```

### Metrics

Enable Prometheus metrics:

```bash
ENABLE_METRICS=true
METRICS_PORT=9090
```
