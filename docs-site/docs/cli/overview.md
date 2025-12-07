---
sidebar_position: 1
title: CLI Overview
description: Complete reference for the ARM CLI
---

# CLI Overview

The ARM CLI (`api-response-manager`) is a powerful command-line tool for managing tunnels, webhooks, and projects.

## Installation

```bash
npm install -g api-response-manager
```

## Global Options

These options work with all commands:

| Option | Description |
|--------|-------------|
| `--version`, `-v` | Show version number |
| `--help`, `-h` | Show help |
| `--json` | Output in JSON format |
| `--quiet`, `-q` | Suppress non-essential output |

## Commands

### Authentication

| Command | Description |
|---------|-------------|
| `arm login` | Authenticate with TunnelAPI |
| `arm logout` | Sign out and clear credentials |
| `arm whoami` | Show current user info |
| `arm status` | Check connection status |

### Tunnels

| Command | Description |
|---------|-------------|
| `arm tunnel <port>` | Create a tunnel to local port |
| `arm tunnel list` | List active tunnels |
| `arm tunnel stop <id>` | Stop a tunnel |

### Webhooks

| Command | Description |
|---------|-------------|
| `arm webhook create` | Create a webhook endpoint |
| `arm webhook list` | List webhook endpoints |
| `arm webhook delete <id>` | Delete a webhook |
| `arm webhook logs <id>` | View webhook request logs |

### Projects

| Command | Description |
|---------|-------------|
| `arm project create <name>` | Create a new project |
| `arm project list` | List all projects |
| `arm project delete <id>` | Delete a project |

### Proxy

| Command | Description |
|---------|-------------|
| `arm proxy start` | Start the API capture proxy |
| `arm proxy stop` | Stop the proxy |

## Configuration

The CLI stores configuration in `~/.armrc`:

```json
{
  "token": "your-jwt-token",
  "apiUrl": "https://api.tunnelapi.in",
  "tunnelUrl": "wss://tunnel.tunnelapi.in"
}
```

### Custom API URL

For self-hosted instances:

```bash
arm config set apiUrl https://api.your-domain.com
arm config set tunnelUrl wss://tunnel.your-domain.com
```

## Examples

### Basic Tunnel

```bash
# Expose port 3000
arm tunnel 3000

# With custom subdomain
arm tunnel 3000 --subdomain myapp

# With authentication required
arm tunnel 3000 --auth

# With rate limiting
arm tunnel 3000 --rate-limit 100
```

### Webhook with Forwarding

```bash
# Create and forward to local server
arm webhook create --forward http://localhost:4000/webhook

# Forward to a tunnel
arm webhook create --forward-tunnel my-tunnel
```

### Project Management

```bash
# Create project
arm project create "Payment API Testing"

# List projects
arm project list

# Start proxy for project
arm proxy start --project payment-api-testing
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Authentication required |
| 3 | Network error |
| 4 | Invalid arguments |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ARM_TOKEN` | JWT token (overrides stored token) |
| `ARM_API_URL` | API server URL |
| `ARM_TUNNEL_URL` | Tunnel server URL |
| `ARM_NO_COLOR` | Disable colored output |

## Next Steps

- [Authentication](/cli/authentication) - Login methods
- [Tunnels](/cli/tunnels) - Tunnel command reference
- [Webhooks](/cli/webhooks) - Webhook command reference
