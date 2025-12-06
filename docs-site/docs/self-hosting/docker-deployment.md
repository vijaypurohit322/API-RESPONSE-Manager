---
sidebar_position: 2
title: Docker Deployment
description: Deploy TunnelAPI with Docker Compose
---

# Docker Deployment

## Quick Start

```bash
# Clone repository
git clone https://github.com/vijaypurohit322/api-response-manager.git
cd api-response-manager

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start services
docker compose -f docker-compose.prod.yml up -d
```

## Environment Configuration

Essential variables in `.env`:

```bash
# MongoDB
MONGODB_URI=mongodb://mongodb:27017/api-response-manager

# Security
JWT_SECRET=your-super-secret-key-min-32-chars

# Domain
FRONTEND_URL=https://tunnelapi.yourdomain.com
API_URL=https://api.tunnelapi.yourdomain.com
TUNNEL_DOMAIN=tunnelapi.yourdomain.com

# OAuth (optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

## Verify Deployment

```bash
# Check services
docker compose ps

# View logs
docker compose logs -f

# Test API
curl https://api.tunnelapi.yourdomain.com/health
```

## Updating

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```
