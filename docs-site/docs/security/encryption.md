---
sidebar_position: 3
title: Encryption
description: Data encryption in TunnelAPI
---

# Encryption

## Transport Encryption

All data in transit is encrypted:
- TLS 1.3 for HTTPS
- WSS for WebSocket connections

## Data at Rest

Sensitive data is encrypted using AES-256-GCM:
- User emails
- User names
- Project names
- API keys

## GDPR Compliance

TunnelAPI is GDPR compliant:
- Data export on request
- Data deletion on request
- Minimal data collection
- Encryption of personal data

## Self-Hosting Encryption

Set encryption key in environment:

```bash
ENCRYPTION_KEY=your-32-character-encryption-key
```

Generate a secure key:

```bash
openssl rand -hex 32
```
