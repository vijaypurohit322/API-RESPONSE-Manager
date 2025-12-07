---
sidebar_position: 5
title: SAML SSO
description: Enterprise SAML 2.0 Single Sign-On
---

# SAML 2.0 SSO (Enterprise)

Integrate TunnelAPI with your enterprise identity provider.

## Supported Identity Providers

- Okta
- Azure AD
- OneLogin
- Auth0
- Google Workspace
- Custom SAML 2.0 IdP

## Configuration

### 1. Get TunnelAPI Metadata

Download SP metadata from:
```
https://yourdomain.com/api/auth/saml/metadata
```

### 2. Configure Your IdP

Upload the SP metadata to your identity provider.

### 3. Configure TunnelAPI

Set environment variables:

```bash
SAML_ENTRYPOINT=https://your-idp.com/sso
SAML_ISSUER=https://yourdomain.com
SAML_CERT=your-idp-certificate
```

### 4. Test SSO

Navigate to your TunnelAPI instance and click "Sign in with SSO".
