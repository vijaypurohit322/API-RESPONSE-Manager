---
sidebar_position: 3
title: Tunnels API
description: Manage tunnels via REST API
---

# Tunnels API

## List Tunnels

```http
GET /api/tunnels
Authorization: Bearer TOKEN
```

## Create Tunnel

```http
POST /api/tunnels
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "subdomain": "myapp",
  "localPort": 3000
}
```

## Get Tunnel

```http
GET /api/tunnels/:id
Authorization: Bearer TOKEN
```

## Delete Tunnel

```http
DELETE /api/tunnels/:id
Authorization: Bearer TOKEN
```

## Tunnel Statistics

```http
GET /api/tunnels/:id/stats
Authorization: Bearer TOKEN
```
