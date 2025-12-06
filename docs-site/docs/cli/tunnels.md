---
sidebar_position: 3
title: Tunnels
description: Create and manage secure tunnels
---

# Tunnel Commands

Create secure HTTPS tunnels to expose your local development server.

## Create a Tunnel

```bash
arm tunnel <port> [options]
```

### Basic Usage

```bash
# Expose port 3000
arm tunnel 3000
```

Output:
```
✓ Tunnel created successfully!
  Public URL: https://abc123.free-tunnelapi.app
  Local Port: 3000
ℹ Forwarding traffic...
```

### Options

| Option | Description |
|--------|-------------|
| `-s, --subdomain <name>` | Custom subdomain |
| `--auth` | Require authentication |
| `--rate-limit <n>` | Requests per minute limit |
| `--ip-whitelist <ips>` | Comma-separated allowed IPs |
| `--basic-auth <user:pass>` | HTTP Basic Authentication |
| `--host <hostname>` | Local hostname (default: localhost) |

### Examples

```bash
# Custom subdomain
arm tunnel 3000 --subdomain myapp
# URL: https://myapp.free-tunnelapi.app

# With rate limiting
arm tunnel 3000 --rate-limit 100

# With IP whitelist
arm tunnel 3000 --ip-whitelist "192.168.1.1,10.0.0.0/8"

# With Basic Auth
arm tunnel 3000 --basic-auth "admin:secret123"

# Different local host
arm tunnel 3000 --host 192.168.1.100
```

## List Tunnels

```bash
arm tunnel list
```

Output:
```
ID          Subdomain    Port    Status    Created
─────────────────────────────────────────────────────
abc123      myapp        3000    active    2 hours ago
def456      demo         8080    active    1 day ago
```

## Stop a Tunnel

```bash
arm tunnel stop <tunnel-id>
```

Or stop all tunnels:

```bash
arm tunnel stop --all
```

## Tunnel Protocols

### HTTP/HTTPS (Default)

```bash
arm tunnel 3000
```

### WebSocket

WebSocket connections are automatically supported:

```bash
arm tunnel 3000
# ws://localhost:3000 → wss://myapp.free-tunnelapi.app
```

### TCP (Coming Soon)

```bash
arm tunnel 22 --protocol tcp
```

## Advanced Configuration

### Request Inspection

View requests in real-time:

```bash
arm tunnel 3000 --inspect
```

### Request Replay

Replay captured requests:

```bash
arm tunnel replay <request-id>
```

### Local HTTPS

If your local server uses HTTPS:

```bash
arm tunnel 3000 --local-https
```

## Tunnel Lifecycle

1. **Created** - Tunnel is registered
2. **Connected** - WebSocket connection established
3. **Active** - Forwarding traffic
4. **Disconnected** - Connection lost (auto-reconnect)
5. **Stopped** - Manually stopped

## Reconnection

The CLI automatically reconnects on network issues:

```
⚠ Connection lost. Reconnecting...
✓ Reconnected successfully!
```

## Limits by Plan

| Plan | Active Tunnels | Subdomain |
|------|----------------|-----------|
| Free | 1 | Random |
| Solo | 3 | Custom |
| Team | 10 | Custom |
| Enterprise | Unlimited | Custom |
