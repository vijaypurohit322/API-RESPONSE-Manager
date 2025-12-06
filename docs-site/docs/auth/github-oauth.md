---
sidebar_position: 3
title: GitHub OAuth
description: Sign in with GitHub
---

# GitHub OAuth Setup

## For Users

Click "Sign in with GitHub" or use:

```bash
arm login --provider github
```

## For Self-Hosting

### 1. Create GitHub OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL:
   - `https://yourdomain.com/api/auth/github/callback`

### 2. Configure Environment

```bash
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

### 3. Restart Services

```bash
docker compose restart backend
```
