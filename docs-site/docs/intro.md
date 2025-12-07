---
sidebar_position: 1
slug: /
title: Introduction
description: TunnelAPI - Secure tunneling, webhook testing, and API collaboration platform
---

# TunnelAPI Documentation

Welcome to **TunnelAPI** - the all-in-one platform for secure tunneling, webhook testing, and API collaboration.

## What is TunnelAPI?

TunnelAPI is a developer tool that helps you:

- **🚇 Expose localhost** - Share your local development server with the world via secure HTTPS tunnels
- **🪝 Test webhooks** - Create instant webhook endpoints to capture, inspect, and debug HTTP requests
- **📊 Collaborate on APIs** - Capture and share API responses with your team using shareable project links
- **🔐 Enterprise-ready** - SAML 2.0, OAuth 2.0, and OIDC support for tunnel authentication

## Quick Start

Get started in under 60 seconds:

```bash
# Install the CLI
npm install -g api-response-manager

# Login to your account
arm login

# Expose your local server
arm tunnel 3000
```

Your local server is now accessible at `https://your-subdomain.free-tunnelapi.app`!

## Key Features

### Secure Tunneling
Expose your localhost to the internet with enterprise-grade security. Perfect for webhooks, demos, and testing.

- HTTPS/TLS encryption included
- Custom subdomains
- TCP and WebSocket support
- Path-based routing (ingress)

### Webhook Testing
Create instant webhook endpoints to capture, inspect, and replay HTTP requests in real-time.

- Signature validation
- Conditional routing
- Payload transformation
- Slack, Discord, Email integrations

### API Response Capture
Capture, share, and collaborate on API responses with your team using shareable project links.

- Real-time updates
- Team collaboration
- Comments and annotations
- Export capabilities

### Enterprise Authentication
Integrate with your identity provider for secure tunnel access.

- SAML 2.0 SSO
- OAuth 2.0 / OIDC
- IP whitelisting
- Rate limiting

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Your Browser   │────▶│   TunnelAPI.in   │────▶│  Your Localhost │
│  or API Client  │◀────│   (Cloud/Self)   │◀────│    :3000        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │   ARM CLI Tool   │
                        │   (WebSocket)    │
                        └──────────────────┘
```

## Next Steps

- [Installation Guide](/getting-started/installation) - Install the CLI and get set up
- [Quick Start](/getting-started/quick-start) - Create your first tunnel in minutes
- [CLI Reference](/cli/overview) - Complete CLI command reference
- [Self-Hosting](/self-hosting/requirements) - Deploy TunnelAPI on your own infrastructure

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/vijaypurohit322/api-response-manager/issues)
- **Email**: vijaypurohit322@gmail.com
- **Documentation**: You're here! 📚
