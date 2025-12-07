---
sidebar_position: 4
title: Webhooks
description: Create and manage webhook endpoints
---

# Webhook Commands

Create instant webhook endpoints to capture, inspect, and debug HTTP requests.

## Create a Webhook

```bash
arm webhook create [options]
```

### Basic Usage

```bash
arm webhook create
```

Output:
```
✓ Webhook created!
  Endpoint: https://tunnelapi.in/webhook/abc123
  
Waiting for requests... (Ctrl+C to exit)
```

### Options

| Option | Description |
|--------|-------------|
| `--forward <url>` | Forward requests to URL |
| `--forward-tunnel <name>` | Forward to a tunnel |
| `--response-code <code>` | Custom response code (default: 200) |
| `--response-body <body>` | Custom response body |
| `--name <name>` | Webhook name |

### Examples

```bash
# Forward to local server
arm webhook create --forward http://localhost:4000/webhook

# Forward to tunnel
arm webhook create --forward-tunnel my-api

# Custom response
arm webhook create --response-code 201 --response-body '{"status": "ok"}'

# Named webhook
arm webhook create --name stripe-webhook
```

## List Webhooks

```bash
arm webhook list
```

Output:
```
ID          Name              Requests    Created
───────────────────────────────────────────────────
abc123      stripe-webhook    42          2 hours ago
def456      github-events     15          1 day ago
```

## View Webhook Logs

```bash
arm webhook logs <webhook-id>
```

Output:
```
Time                Method    Path           Status
─────────────────────────────────────────────────────
2024-01-15 10:30    POST      /              200
2024-01-15 10:28    POST      /              200
2024-01-15 10:25    POST      /              200
```

### Detailed View

```bash
arm webhook logs <webhook-id> --detailed
```

Shows full request/response including headers and body.

## Delete a Webhook

```bash
arm webhook delete <webhook-id>
```

## Webhook Features

### Signature Validation

Validate webhook signatures from providers:

```bash
arm webhook create --validate-signature stripe --secret whsec_xxx
```

Supported providers:
- Stripe
- GitHub
- Slack
- Shopify
- Custom HMAC

### Conditional Routing

Route requests based on conditions:

```bash
arm webhook create --route "header:X-Event-Type=payment" --forward http://localhost:4000/payments
arm webhook create --route "body:$.type=order" --forward http://localhost:4000/orders
```

### Payload Transformation

Transform payloads before forwarding:

```bash
arm webhook create --transform '{"event": "$.type", "data": "$.payload"}'
```

### Integrations

Send notifications on webhook events:

```bash
# Slack notification
arm webhook create --notify-slack https://hooks.slack.com/xxx

# Discord notification
arm webhook create --notify-discord https://discord.com/api/webhooks/xxx

# Email notification
arm webhook create --notify-email your@email.com
```

## Real-Time Inspection

Watch requests in real-time:

```bash
arm webhook watch <webhook-id>
```

Output:
```
[10:30:15] POST / 
  Headers: {"content-type": "application/json", ...}
  Body: {"event": "payment.completed", ...}
  
[10:30:18] POST /
  Headers: {"content-type": "application/json", ...}
  Body: {"event": "order.created", ...}
```

## Replay Requests

Replay a captured request:

```bash
arm webhook replay <request-id>
```

Replay with modifications:

```bash
arm webhook replay <request-id> --header "X-Test: true"
```

## Limits by Plan

| Plan | Webhook Endpoints | Request History |
|------|-------------------|-----------------|
| Free | 2 | 24 hours |
| Solo | 10 | 7 days |
| Team | 50 | 30 days |
| Enterprise | Unlimited | 90 days |
