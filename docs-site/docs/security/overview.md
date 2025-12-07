---
sidebar_position: 1
title: Security Overview
description: Security features and best practices
---

# Security

TunnelAPI is built with security as a priority.

## Security Features

### Transport Security
- All traffic encrypted with TLS 1.3
- HTTPS enforced on all endpoints
- WebSocket connections secured with WSS

### Authentication
- JWT tokens with short expiration
- OAuth 2.0 / OIDC support
- SAML 2.0 for enterprise SSO
- Multi-factor authentication (coming soon)

### Access Control
- IP whitelisting
- Rate limiting
- Basic authentication for tunnels
- Role-based access control

### Data Protection
- AES-256-GCM encryption for sensitive data
- GDPR compliant
- Data export and deletion support
- No logging of request bodies (configurable)

## Best Practices

1. **Use strong JWT secrets** - Minimum 32 characters
2. **Enable rate limiting** - Protect against abuse
3. **Use IP whitelisting** - Restrict access when possible
4. **Regular updates** - Keep software up to date
5. **Monitor logs** - Watch for suspicious activity
