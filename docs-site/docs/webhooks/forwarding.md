---
sidebar_position: 3
title: Request Forwarding
description: Forward webhook requests to your local server
---

# Request Forwarding

Forward incoming webhook requests to your local development server.

## Forward to URL

```bash
arm webhook create --forward http://localhost:4000/webhook
```

## Forward to Tunnel

```bash
arm webhook create --forward-tunnel my-api
```

## Forwarding Options

| Option | Description |
|--------|-------------|
| `--forward <url>` | Forward to URL |
| `--forward-tunnel <name>` | Forward to tunnel |
| `--forward-timeout <ms>` | Timeout in milliseconds |
| `--forward-retry <n>` | Retry count on failure |

## Request Transformation

Transform requests before forwarding:

```bash
arm webhook create \
  --forward http://localhost:4000/webhook \
  --transform '{"event": "$.type", "data": "$.payload"}'
```
