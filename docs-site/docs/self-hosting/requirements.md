---
sidebar_position: 1
title: Requirements
description: System requirements for self-hosting TunnelAPI
---

# Self-Hosting Requirements

## Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| CPU | 2 cores |
| RAM | 4 GB |
| Storage | 20 GB SSD |
| OS | Ubuntu 20.04+ / Debian 11+ |

## Recommended for Production

| Component | Requirement |
|-----------|-------------|
| CPU | 4+ cores |
| RAM | 8+ GB |
| Storage | 50+ GB SSD |
| Network | 100 Mbps+ |

## Software Requirements

- Docker Engine 20.10+
- Docker Compose v2.0+
- Node.js 18+ (for development)
- MongoDB 6.0+ (or use Docker)
- Nginx (for reverse proxy)

## Network Requirements

| Port | Service | Required |
|------|---------|----------|
| 80 | HTTP | Yes |
| 443 | HTTPS | Yes |
| 8080 | Tunnel Server | Yes |
| 27017 | MongoDB | Internal only |

## Domain Requirements

- Primary domain (e.g., `tunnelapi.yourdomain.com`)
- Wildcard subdomain for tunnels (e.g., `*.tunnelapi.yourdomain.com`)
- SSL certificates (Let's Encrypt recommended)
