# CLI Updates for Advanced Tunnel Features

## ✅ Changes Made

### 1. Enhanced `tunnel` Command
Added new options to the main tunnel command:
```bash
arm tunnel [port] [options]

Options:
  -s, --subdomain <subdomain>    Custom subdomain
  -n, --name <name>              Tunnel name
  -a, --auth                     Enable basic authentication
  -r, --rate-limit <limit>       Rate limit (requests per minute)
  -p, --protocol <protocol>      Protocol (http, https, tcp, ws, wss)
  --ssl                          Enable SSL/HTTPS
  -d, --domain <domain>          Custom domain
```

### 2. New Commands Added

#### Custom Domain
```bash
arm tunnel:domain <tunnelId> <domain>
```
Example:
```bash
arm tunnel:domain abc123 api.yourdomain.com
```

#### SSL Certificate Upload
```bash
arm tunnel:ssl <tunnelId> --cert <path> --key <path> [--ca <path>]
```
Example:
```bash
arm tunnel:ssl abc123 --cert cert.pem --key key.pem --ca ca.pem
```

#### OAuth Configuration
```bash
arm tunnel:auth:oauth <tunnelId> [options]

Options:
  --provider <provider>          OAuth provider (google, github, microsoft, custom)
  --client-id <id>              OAuth client ID
  --client-secret <secret>      OAuth client secret
  --callback-url <url>          OAuth callback URL
  --scope <scope>               OAuth scope (comma-separated)
```
Example:
```bash
arm tunnel:auth:oauth abc123 \
  --provider google \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_SECRET \
  --callback-url https://yourtunnel.arm.dev/auth/callback \
  --scope openid,email,profile
```

#### OIDC Configuration
```bash
arm tunnel:auth:oidc <tunnelId> [options]

Options:
  --issuer <url>                OIDC issuer URL
  --client-id <id>              OIDC client ID
  --client-secret <secret>      OIDC client secret
  --callback-url <url>          OIDC callback URL
```
Example:
```bash
arm tunnel:auth:oidc abc123 \
  --issuer https://accounts.google.com \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_SECRET \
  --callback-url https://yourtunnel.arm.dev/auth/callback
```

#### SAML Configuration
```bash
arm tunnel:auth:saml <tunnelId> [options]

Options:
  --entry-point <url>           SAML entry point URL
  --issuer <issuer>             SAML issuer
  --cert <path>                 Path to IdP certificate file
  --callback-url <url>          SAML callback URL
```
Example:
```bash
arm tunnel:auth:saml abc123 \
  --entry-point https://idp.example.com/saml/sso \
  --issuer https://yourtunnel.arm.dev \
  --cert idp-cert.pem \
  --callback-url https://yourtunnel.arm.dev/auth/saml/callback
```

#### Ingress Configuration
```bash
arm tunnel:ingress <tunnelId> <rules> [--tls]

Rules format: "/path=host:port,/path2=host:port"
```
Example:
```bash
arm tunnel:ingress abc123 "/api=localhost:3000,/admin=localhost:4000" --tls
```

## 📝 Usage Examples

### Example 1: Create HTTPS Tunnel
```bash
arm tunnel 3000 --protocol https --ssl --subdomain myapi
```

### Example 2: Create TCP Tunnel
```bash
arm tunnel 5432 --protocol tcp --subdomain postgres
```

### Example 3: Create Tunnel with Custom Domain
```bash
# Create tunnel
arm tunnel 3000 --protocol https --ssl

# Set custom domain
arm tunnel:domain <tunnel-id> api.mycompany.com
```

### Example 4: Create Tunnel with OAuth
```bash
# Create tunnel
arm tunnel 3000 --protocol https --ssl --subdomain myapi

# Configure OAuth
arm tunnel:auth:oauth <tunnel-id> \
  --provider google \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_SECRET \
  --callback-url https://myapi.tunnel.arm.dev/auth/callback
```

### Example 5: Create Tunnel with Ingress
```bash
# Create tunnel
arm tunnel 3000 --protocol https --ssl

# Configure ingress rules
arm tunnel:ingress <tunnel-id> \
  "/v1=localhost:3000,/v2=localhost:4000" \
  --tls
```

## 🔧 Updated Files

1. **cli/bin/arm.js** - Added new commands
2. **cli/commands/tunnel.js** - Added new functions
3. **cli/utils/api.js** - Added new API methods

## 📦 No New Dependencies Required

All new features use existing dependencies.

## 🚀 Testing

Test the new commands:
```bash
# Test HTTPS tunnel
arm tunnel 3000 --protocol https --ssl

# Test custom domain
arm tunnel:domain <tunnel-id> test.example.com

# Test SSL upload
arm tunnel:ssl <tunnel-id> --cert cert.pem --key key.pem

# Test OAuth
arm tunnel:auth:oauth <tunnel-id> --provider google --client-id test --client-secret test --callback-url http://localhost/callback

# Test ingress
arm tunnel:ingress <tunnel-id> "/api=localhost:3000" --tls
```

## 📖 Help Output

```bash
arm --help
arm tunnel --help
arm tunnel:domain --help
arm tunnel:ssl --help
arm tunnel:auth:oauth --help
arm tunnel:auth:oidc --help
arm tunnel:auth:saml --help
arm tunnel:ingress --help
```
