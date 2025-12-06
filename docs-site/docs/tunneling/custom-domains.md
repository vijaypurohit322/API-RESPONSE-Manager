---
sidebar_position: 2
title: Custom Domains
description: Use your own domain with TunnelAPI
---

# Custom Domains

Use your own domain instead of `*.tunnelapi.in` subdomains.

## Setup Custom Domain

### 1. Add DNS Record

Add a CNAME record pointing to TunnelAPI:

```
myapp.yourdomain.com  CNAME  tunnel.tunnelapi.in
```

### 2. Configure in Dashboard

1. Go to Settings → Custom Domains
2. Add your domain: `myapp.yourdomain.com`
3. Verify DNS propagation

### 3. Use in CLI

```bash
arm tunnel 3000 --domain myapp.yourdomain.com
```

## SSL Certificates

TunnelAPI automatically provisions SSL certificates for custom domains using Let's Encrypt.

- Certificates are auto-renewed
- HTTPS is enforced by default
- HTTP redirects to HTTPS

## Wildcard Domains

For Enterprise plans, configure wildcard domains:

```
*.dev.yourdomain.com  CNAME  tunnel.tunnelapi.in
```

Then use any subdomain:

```bash
arm tunnel 3000 --domain feature-123.dev.yourdomain.com
```

## Troubleshooting

### DNS Not Propagated

Check DNS propagation:

```bash
nslookup myapp.yourdomain.com
# Should return tunnel.tunnelapi.in
```

### Certificate Errors

Certificates may take up to 5 minutes to provision. If issues persist:

1. Verify DNS is correct
2. Check domain is verified in dashboard
3. Contact support
