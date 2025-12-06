---
sidebar_position: 1
title: Authentication Overview
description: Authentication options for TunnelAPI
---

# Authentication

TunnelAPI supports multiple authentication methods.

## Supported Methods

| Method | Description |
|--------|-------------|
| Email/Password | Traditional authentication |
| Google OAuth | Sign in with Google |
| GitHub OAuth | Sign in with GitHub |
| Microsoft OAuth | Sign in with Microsoft |
| SAML 2.0 | Enterprise SSO |

## Web Dashboard

Sign in at [tunnelapi.in](https://tunnelapi.in):

1. Click "Sign In"
2. Choose your authentication method
3. Complete the authentication flow

## CLI Authentication

```bash
arm login
```

Choose from interactive menu or specify provider:

```bash
arm login --provider google
arm login --provider github
arm login --provider microsoft
```
