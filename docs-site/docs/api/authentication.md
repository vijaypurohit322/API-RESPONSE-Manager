---
sidebar_position: 1
title: API Authentication
description: Authenticate with the TunnelAPI REST API
---

# API Authentication

## Getting an API Token

### Via CLI

```bash
arm login
arm config get token
```

### Via Dashboard

1. Go to Settings → API Tokens
2. Generate new token
3. Copy and store securely

## Using the Token

Include in Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.tunnelapi.in/api/projects
```

## Token Expiration

Tokens expire after 7 days. Refresh by re-authenticating.

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Authentication | 5/min |
| API calls | 100/min |
| Tunnel creation | 10/min |
