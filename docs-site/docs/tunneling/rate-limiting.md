---
sidebar_position: 4
title: Rate Limiting
description: Control traffic to your tunnels
---

# Rate Limiting

Protect your local server from excessive traffic.

## Enable Rate Limiting

```bash
arm tunnel 3000 --rate-limit 100
```

This limits requests to 100 per minute per IP.

## Rate Limit Options

| Option | Description |
|--------|-------------|
| `--rate-limit <n>` | Requests per minute |
| `--rate-limit-burst <n>` | Burst allowance |
| `--rate-limit-by <key>` | Rate limit key (ip, user, global) |

## Examples

```bash
# 60 requests per minute per IP
arm tunnel 3000 --rate-limit 60

# With burst allowance
arm tunnel 3000 --rate-limit 60 --rate-limit-burst 10

# Rate limit by authenticated user
arm tunnel 3000 --rate-limit 100 --rate-limit-by user --auth
```

## Rate Limit Response

When rate limited, clients receive:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642000000
```

## Dashboard Configuration

Configure rate limits in the web dashboard:

1. Go to Tunnels → Your Tunnel → Settings
2. Enable rate limiting
3. Set requests per minute
4. Configure burst allowance
5. Save settings
