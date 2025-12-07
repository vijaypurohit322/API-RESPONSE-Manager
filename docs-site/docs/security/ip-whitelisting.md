---
sidebar_position: 2
title: IP Whitelisting
description: Restrict access by IP address
---

# IP Whitelisting

Restrict tunnel access to specific IP addresses.

## CLI Usage

```bash
arm tunnel 3000 --ip-whitelist "192.168.1.0/24,10.0.0.1"
```

## Supported Formats

- Single IP: `192.168.1.1`
- CIDR range: `192.168.1.0/24`
- Multiple IPs: `192.168.1.1,10.0.0.1`

## Dashboard Configuration

1. Go to Tunnels → Your Tunnel → Settings
2. Enable IP Whitelisting
3. Add allowed IPs/ranges
4. Save

## Response for Blocked IPs

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{"error": "Access denied: IP not whitelisted"}
```
