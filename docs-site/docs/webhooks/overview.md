---
sidebar_position: 1
title: Webhook Overview
description: Test and debug webhooks with TunnelAPI
---

# Webhook Testing

Create instant webhook endpoints to capture, inspect, and debug HTTP requests.

## Why Use Webhook Testing?

- **No deployment needed** - Test webhooks during local development
- **Real-time inspection** - See requests as they arrive
- **Request replay** - Replay requests for debugging
- **Signature validation** - Verify webhook signatures

## Quick Start

```bash
# Create a webhook endpoint
arm webhook create

# Output:
# ✓ Webhook created!
#   Endpoint: https://tunnelapi.in/webhook/abc123
```

Use this URL in your webhook provider (Stripe, GitHub, etc.)

## Features

### Request Capture
All incoming requests are captured with:
- Headers
- Body
- Query parameters
- Timestamps

### Request Forwarding
Forward requests to your local server:

```bash
arm webhook create --forward http://localhost:4000/webhook
```

### Signature Validation
Validate signatures from providers:

```bash
arm webhook create --validate-signature stripe --secret whsec_xxx
```

### Integrations
Get notified on webhook events:
- Slack
- Discord
- Email
