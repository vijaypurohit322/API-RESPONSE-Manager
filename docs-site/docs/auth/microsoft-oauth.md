---
sidebar_position: 4
title: Microsoft OAuth
description: Sign in with Microsoft
---

# Microsoft OAuth Setup

## For Users

Click "Sign in with Microsoft" or use:

```bash
arm login --provider microsoft
```

## For Self-Hosting

### 1. Register Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Azure Active Directory → App registrations
3. New registration
4. Add redirect URI:
   - `https://yourdomain.com/api/auth/microsoft/callback`

### 2. Configure Environment

```bash
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
```
