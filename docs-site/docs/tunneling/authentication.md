---
sidebar_position: 3
title: Tunnel Authentication
description: Secure your tunnels with authentication
---

# Tunnel Authentication

Protect your tunnels with various authentication methods.

## Basic Authentication

```bash
arm tunnel 3000 --basic-auth "username:password"
```

Visitors must enter credentials to access the tunnel.

## OAuth/OIDC Authentication

Require users to authenticate with OAuth:

```bash
arm tunnel 3000 --auth --oauth-provider google
```

Supported providers:
- Google
- GitHub
- Microsoft
- Custom OIDC

## SAML 2.0 (Enterprise)

Integrate with your identity provider:

```bash
arm tunnel 3000 --auth --saml-metadata https://idp.company.com/metadata
```

## IP Whitelisting

Restrict access to specific IPs:

```bash
arm tunnel 3000 --ip-whitelist "192.168.1.0/24,10.0.0.1"
```

## Combining Methods

Use multiple authentication methods:

```bash
arm tunnel 3000 \
  --auth \
  --oauth-provider google \
  --ip-whitelist "10.0.0.0/8"
```

## Authentication Flow

1. User visits tunnel URL
2. TunnelAPI checks authentication requirements
3. User is redirected to login if needed
4. After authentication, request is forwarded to your local server

## Dashboard Configuration

Configure authentication in the web dashboard:

1. Go to Tunnels → Your Tunnel → Settings
2. Enable authentication
3. Configure allowed users/domains
4. Save settings
