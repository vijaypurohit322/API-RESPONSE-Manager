---
sidebar_position: 1
title: Tunnel Setup
description: Configure secure tunnels for your local development
---

# Tunnel Setup

Learn how to create and configure secure HTTPS tunnels.

## Basic Tunnel

```bash
arm tunnel 3000
```

This creates a tunnel from a random subdomain to your local port 3000.

## Custom Subdomain

```bash
arm tunnel 3000 --subdomain myapp
```

Your server is now accessible at `https://myapp.free-tunnelapi.app`

## Tunnel Options

| Option | Description | Example |
|--------|-------------|---------|
| `--subdomain, -s` | Custom subdomain | `--subdomain myapp` |
| `--host` | Local hostname | `--host 192.168.1.100` |
| `--auth` | Require authentication | `--auth` |
| `--rate-limit` | Requests per minute | `--rate-limit 100` |
| `--ip-whitelist` | Allowed IPs | `--ip-whitelist "1.2.3.4"` |

## How Tunnels Work

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│   TunnelAPI.in   │────▶│  localhost  │
│             │◀────│   (WebSocket)    │◀────│    :3000    │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   ARM CLI    │
                    │  (Your PC)   │
                    └──────────────┘
```

1. CLI establishes WebSocket connection to tunnel server
2. Incoming HTTP requests are forwarded through WebSocket
3. CLI forwards requests to your local server
4. Responses travel back through the same path

## Supported Protocols

- **HTTP/HTTPS** - Web traffic (default)
- **WebSocket** - Real-time connections
- **Server-Sent Events** - Streaming responses

## Keep Tunnel Alive

The CLI automatically reconnects on network issues. For long-running tunnels:

```bash
# Run in background
nohup arm tunnel 3000 --subdomain myapp &

# Or use a process manager
pm2 start "arm tunnel 3000 --subdomain myapp" --name my-tunnel
```

## Multiple Tunnels

Create multiple tunnels simultaneously:

```bash
# Terminal 1
arm tunnel 3000 --subdomain frontend

# Terminal 2
arm tunnel 5000 --subdomain api
```
