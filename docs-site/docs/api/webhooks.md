---
sidebar_position: 4
title: Webhooks API
description: Manage webhooks via REST API
---

# Webhooks API

## List Webhooks

```http
GET /api/webhooks
Authorization: Bearer TOKEN
```

## Create Webhook

```http
POST /api/webhooks
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "stripe-webhook",
  "forwardUrl": "http://localhost:4000/webhook"
}
```

## Get Webhook

```http
GET /api/webhooks/:id
Authorization: Bearer TOKEN
```

## Get Webhook Logs

```http
GET /api/webhooks/:id/logs
Authorization: Bearer TOKEN
```

## Delete Webhook

```http
DELETE /api/webhooks/:id
Authorization: Bearer TOKEN
```
