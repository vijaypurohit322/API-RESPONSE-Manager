---
sidebar_position: 2
title: Quick Start
description: Get started with TunnelAPI in under 5 minutes
---

# Quick Start

Get up and running with TunnelAPI in under 5 minutes.

## Step 1: Install the CLI

```bash
npm install -g api-response-manager
```

## Step 2: Login

```bash
arm login
```

Choose your preferred authentication method:
- **Email/Password** - Traditional login
- **Google** - OAuth with Google account
- **GitHub** - OAuth with GitHub account
- **Microsoft** - OAuth with Microsoft account

The CLI will open your browser for OAuth authentication and automatically capture the credentials.

## Step 3: Create a Tunnel

Expose your local development server:

```bash
# Start your local server (example: React app on port 3000)
npm start

# In another terminal, create a tunnel
arm tunnel 3000
```

Output:
```
✓ Tunnel created successfully!
  Public URL: https://abc123.free-tunnelapi.app
  Local Port: 3000
ℹ Forwarding traffic...
```

Your local server is now accessible at the public URL!

## Step 4: Use a Custom Subdomain

```bash
arm tunnel 3000 --subdomain myapp
```

Your server is now at `https://myapp.free-tunnelapi.app`

## Step 5: Create a Webhook Endpoint

```bash
arm webhook create
```

Output:
```
✓ Webhook created!
  Endpoint: https://tunnelapi.in/webhook/abc123
  
Waiting for requests... (Ctrl+C to exit)
```

Send requests to this URL and see them in real-time!

## Common Use Cases

### Webhook Development

Test Stripe, GitHub, or Slack webhooks locally:

```bash
# Create webhook and forward to local server
arm webhook create --forward http://localhost:4000/webhook
```

### Mobile App Testing

Connect your mobile app to your local backend:

```bash
arm tunnel 5000 --subdomain my-api
# Use https://my-api.free-tunnelapi.app in your mobile app
```

### Client Demos

Share your work-in-progress with clients:

```bash
arm tunnel 3000 --subdomain demo-client-name
# Share the URL with your client
```

### Team Collaboration

Share API responses with your team:

```bash
# Create a project
arm project create "My API Project"

# Capture responses via proxy
arm proxy start --project my-api-project
```

## CLI Commands Overview

| Command | Description |
|---------|-------------|
| `arm login` | Authenticate with TunnelAPI |
| `arm tunnel <port>` | Create a tunnel to local port |
| `arm webhook create` | Create a webhook endpoint |
| `arm project list` | List your projects |
| `arm status` | Check connection status |
| `arm logout` | Sign out |

## Next Steps

- [CLI Reference](/cli/overview) - Complete command documentation
- [Tunneling Guide](/tunneling/setup) - Advanced tunnel configuration
- [Webhook Guide](/webhooks/overview) - Webhook testing features
- [Self-Hosting](/self-hosting/requirements) - Deploy on your infrastructure
