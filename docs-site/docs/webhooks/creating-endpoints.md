---
sidebar_position: 2
title: Creating Endpoints
description: Create and configure webhook endpoints
---

# Creating Webhook Endpoints

## Basic Endpoint

```bash
arm webhook create
```

## Named Endpoint

```bash
arm webhook create --name stripe-payments
```

## Custom Response

```bash
arm webhook create \
  --response-code 201 \
  --response-body '{"received": true}'
```

## With Forwarding

```bash
arm webhook create --forward http://localhost:4000/webhook
```

## Dashboard

Create webhooks in the web dashboard:

1. Go to Webhooks → Create New
2. Configure options
3. Copy the endpoint URL
4. Use in your webhook provider
