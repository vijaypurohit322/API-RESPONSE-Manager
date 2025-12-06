---
sidebar_position: 2
title: Google OAuth
description: Sign in with Google
---

# Google OAuth Setup

## For Users

Simply click "Sign in with Google" on the login page or use:

```bash
arm login --provider google
```

## For Self-Hosting

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/google/callback`

### 2. Configure Environment

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 3. Restart Services

```bash
docker compose restart backend
```
