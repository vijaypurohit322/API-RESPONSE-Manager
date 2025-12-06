---
sidebar_position: 3
title: Docker Setup
description: Run TunnelAPI using Docker Compose
---

# Docker Setup

Deploy TunnelAPI using Docker Compose for quick local development or self-hosting.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+

## Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/vijaypurohit322/api-response-manager.git
cd api-response-manager

# Copy environment file
cp .env.example .env

# Start all services
docker compose up -d
```

## Services

The Docker Compose setup includes:

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 8081 | React web application |
| **Backend** | 5000 | Express API server |
| **MongoDB** | 27017 | Database |
| **Tunnel Server** | 8080 | WebSocket tunnel server |
| **Proxy** | 3001 | API capture proxy |

## Environment Configuration

Edit `.env` with your settings:

```bash
# MongoDB
MONGODB_URI=mongodb://mongodb:27017/api-response-manager

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key

# OAuth Credentials (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Tunnel Server
TUNNEL_SERVER_URL=wss://tunnel.yourdomain.com
TUNNEL_DOMAIN=yourdomain.com
```

## Production Deployment

For production, use the production compose file:

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Production Considerations

1. **Use external MongoDB** - Consider MongoDB Atlas or a managed database
2. **Enable SSL** - Use a reverse proxy like Nginx with Let's Encrypt
3. **Set strong secrets** - Generate random JWT secrets
4. **Configure backups** - Set up MongoDB backup strategy

## Health Checks

All services include health checks:

```bash
# Check service health
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f tunnel-server
```

## Scaling

Scale the backend for higher load:

```bash
docker compose up -d --scale backend=3
```

## Updating

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker compose logs mongodb

# Restart MongoDB
docker compose restart mongodb
```

### Port Conflicts

If ports are already in use, modify `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3000:80"  # Change 8081 to 3000
```

## Next Steps

- [Nginx Setup](/self-hosting/nginx-setup) - Configure reverse proxy
- [Scaling Guide](/self-hosting/scaling) - Production scaling strategies
