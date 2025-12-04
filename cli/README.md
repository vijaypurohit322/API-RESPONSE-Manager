# ARM CLI - API Response Manager Command Line Interface

[![npm version](https://img.shields.io/npm/v/api-response-manager.svg)](https://www.npmjs.com/package/api-response-manager)
[![npm downloads](https://img.shields.io/npm/dt/api-response-manager.svg)](https://www.npmjs.com/package/api-response-manager)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](https://github.com/vijaypurohit322/api-response-manager/blob/main/LICENSE)

Command-line interface for API Response Manager. Manage tunnels, webhooks, and projects from your terminal.

**Version:** 2.5.0 | **Live Service:** https://tunnelapi.in

## Installation

### Option 1: Install from npm (Recommended)
```bash
npm install -g api-response-manager
```

After installation, verify:
```bash
arm --version
arm --help
```

### Option 2: Install from Source
```bash
# Clone the repository
git clone https://github.com/vijaypurohit322/api-response-manager.git
cd api-response-manager/cli

# Install dependencies
npm install

# Link globally
npm link

# Verify installation
arm --version
```

### Option 3: Use with npx (No Installation)
```bash
npx api-response-manager login
npx api-response-manager tunnel 3000
npx api-response-manager webhook
```

## Quick Start

### 1. Login

**Interactive Login (Recommended)**
```bash
arm login
# Choose from: Email/Password, Google, GitHub, or Microsoft
```

**Email & Password**
```bash
arm login -e your@email.com -p yourpassword
```

**Social Login (OAuth)**
```bash
# Login with Google
arm login --provider google

# Login with GitHub
arm login --provider github

# Login with Microsoft
arm login --provider microsoft
```

The CLI will:
1. Generate a unique device code
2. Open your browser automatically
3. Wait for you to authenticate
4. Store your credentials securely

### 2. Start a Tunnel
```bash
# Expose local port 3000
arm tunnel 3000

# With custom subdomain
arm tunnel 3000 --subdomain myapi

# With authentication
arm tunnel 3000 --auth --rate-limit 100
```

### 3. Create a Webhook
```bash
# Basic webhook
arm webhook

# With forwarding to URL
arm webhook --forward http://localhost:4000/webhook

# With forwarding to tunnel
arm webhook --tunnel <tunnel-id>
```

## Commands

### Authentication

#### `arm login`
Authenticate with API Response Manager

**Options:**
- `-e, --email <email>` - Email address (for email/password login)
- `-p, --password <password>` - Password (for email/password login)
- `--provider <provider>` - OAuth provider: google, github, or microsoft

**Examples:**
```bash
# Interactive login (choose method)
arm login

# Email & Password
arm login -e user@example.com -p mypassword

# Social Login (OAuth Device Flow)
arm login --provider github
arm login --provider google
arm login --provider microsoft
```

**OAuth Device Flow:**
When using social login, the CLI will:
1. Generate a unique device code (e.g., `ABCD-EFGH`)
2. Display a verification URL
3. Automatically open your browser
4. Wait for you to complete authentication
5. Store your token securely

Example output:
```bash
$ arm login --provider github

🌐 Logging in with github...

📋 Please complete authentication:

  1. Visit: https://localhost:5173/device
  2. Enter code: ABCD-EFGH

  Code expires in 600 seconds

? Open browser automatically? (Y/n) 

✓ Browser opened

⠋ Waiting for authentication...
✓ Authentication successful!

User: John Doe
Provider: github
Token saved to: ~/.config/arm-cli/config.json

✓ You can now use all ARM CLI commands
```

#### `arm logout`
Logout from API Response Manager
```bash
arm logout
```

### Tunnels

#### `arm tunnel <port>`
Start a tunnel to expose local server
```bash
# Basic HTTP tunnel
arm tunnel 3000

# HTTPS tunnel with SSL
arm tunnel 3000 --protocol https --ssl

# TCP tunnel (for databases, etc.)
arm tunnel 5432 --protocol tcp --subdomain postgres

# WebSocket tunnel
arm tunnel 8080 --protocol ws

# With custom subdomain and authentication
arm tunnel 3000 --subdomain myapi --name "My API" --auth --rate-limit 100

# With custom domain
arm tunnel 3000 --protocol https --ssl --domain api.yourdomain.com
```

Options:
- `-s, --subdomain <subdomain>` - Custom subdomain
- `-n, --name <name>` - Tunnel name
- `-a, --auth` - Enable basic authentication
- `-r, --rate-limit <limit>` - Rate limit (requests per minute, default: 60)
- `-p, --protocol <protocol>` - Protocol: http, https, tcp, ws, wss (default: http)
- `--ssl` - Enable SSL/HTTPS
- `-d, --domain <domain>` - Custom domain

#### `arm tunnel:list`
List all active tunnels
```bash
arm tunnel:list
```

#### `arm tunnel:stop <tunnelId>`
Stop a tunnel
```bash
arm tunnel:stop 507f1f77bcf86cd799439011
```

#### `arm tunnel:logs <tunnelId>`
View tunnel request logs
```bash
arm tunnel:logs 507f1f77bcf86cd799439011
arm tunnel:logs 507f1f77bcf86cd799439011 --follow
arm tunnel:logs 507f1f77bcf86cd799439011 --lines 100
```

Options:
- `-f, --follow` - Follow log output (real-time)
- `-n, --lines <number>` - Number of lines to show (default: 50)

#### `arm tunnel:domain <tunnelId> <domain>`
Set custom domain for tunnel
```bash
arm tunnel:domain 507f1f77bcf86cd799439011 api.yourdomain.com
```

#### `arm tunnel:ssl <tunnelId>`
Upload SSL certificate for tunnel
```bash
arm tunnel:ssl 507f1f77bcf86cd799439011 --cert cert.pem --key key.pem
arm tunnel:ssl 507f1f77bcf86cd799439011 --cert cert.pem --key key.pem --ca ca.pem
```

Options:
- `--cert <path>` - Path to certificate file
- `--key <path>` - Path to private key file
- `--ca <path>` - Path to CA certificate file (optional)

#### `arm tunnel:auth:oauth <tunnelId>`
Configure OAuth authentication for tunnel
```bash
arm tunnel:auth:oauth 507f1f77bcf86cd799439011 \
  --provider google \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_SECRET \
  --callback-url https://yourtunnel.arm.dev/auth/callback \
  --scope openid,email,profile
```

Options:
- `--provider <provider>` - OAuth provider: google, github, microsoft, custom
- `--client-id <id>` - OAuth client ID
- `--client-secret <secret>` - OAuth client secret
- `--callback-url <url>` - OAuth callback URL
- `--scope <scope>` - OAuth scope (comma-separated)

#### `arm tunnel:auth:oidc <tunnelId>`
Configure OpenID Connect authentication for tunnel
```bash
arm tunnel:auth:oidc 507f1f77bcf86cd799439011 \
  --issuer https://accounts.google.com \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_SECRET \
  --callback-url https://yourtunnel.arm.dev/auth/callback
```

Options:
- `--issuer <url>` - OIDC issuer URL
- `--client-id <id>` - OIDC client ID
- `--client-secret <secret>` - OIDC client secret
- `--callback-url <url>` - OIDC callback URL

#### `arm tunnel:auth:saml <tunnelId>`
Configure SAML authentication for tunnel
```bash
arm tunnel:auth:saml 507f1f77bcf86cd799439011 \
  --entry-point https://idp.example.com/saml/sso \
  --issuer https://yourtunnel.arm.dev \
  --cert idp-cert.pem \
  --callback-url https://yourtunnel.arm.dev/auth/saml/callback
```

Options:
- `--entry-point <url>` - SAML entry point URL
- `--issuer <issuer>` - SAML issuer
- `--cert <path>` - Path to IdP certificate file
- `--callback-url <url>` - SAML callback URL

#### `arm tunnel:ingress <tunnelId> <rules>`
Configure ingress rules for tunnel (path-based routing)
```bash
# Route different paths to different backends
arm tunnel:ingress 507f1f77bcf86cd799439011 \
  "/api=localhost:3000,/admin=localhost:4000" \
  --tls

# Single rule
arm tunnel:ingress 507f1f77bcf86cd799439011 "/api=localhost:3000"
```

Options:
- `--tls` - Enable TLS for ingress

Rules format: `/path=host:port,/path2=host:port`

### Webhooks

#### `arm webhook`
Create a new webhook
```bash
arm webhook
arm webhook --name "GitHub Webhook"
arm webhook --forward http://localhost:4000/webhook
arm webhook --tunnel 507f1f77bcf86cd799439011
arm webhook --expires 48
```

Options:
- `-n, --name <name>` - Webhook name
- `-f, --forward <url>` - Forward URL
- `-t, --tunnel <tunnelId>` - Forward to tunnel
- `-e, --expires <hours>` - Expiration time in hours (default: 24)

#### `arm webhook:list`
List all webhooks
```bash
arm webhook:list
```

#### `arm webhook:delete <webhookId>`
Delete a webhook
```bash
arm webhook:delete a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

#### `arm webhook:logs <webhookId>`
View webhook request logs
```bash
arm webhook:logs a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
arm webhook:logs a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6 --follow
arm webhook:logs a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6 --lines 100
```

Options:
- `-f, --follow` - Follow log output (real-time)
- `-n, --lines <number>` - Number of lines to show (default: 50)

#### `arm webhook:replay <webhookId> <requestId>`
Replay a webhook request
```bash
arm webhook:replay a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6 507f1f77bcf86cd799439011
```

### Projects

#### `arm projects`
List all projects
```bash
arm projects
```

#### `arm project:create <name>`
Create a new project
```bash
arm project:create "My API Project"
arm project:create "My API Project" --description "Testing API endpoints"
```

Options:
- `-d, --description <description>` - Project description

#### `arm project:share <projectId>`
Get shareable link for a project
```bash
arm project:share 507f1f77bcf86cd799439011
```

#### `arm project:responses <projectId>`
View project API responses
```bash
arm project:responses 507f1f77bcf86cd799439011
arm project:responses 507f1f77bcf86cd799439011 --limit 20
```

Options:
- `-n, --limit <number>` - Number of responses to show (default: 10)

### Logs

#### `arm logs <id>`
View logs for tunnels or webhooks (auto-detects type)
```bash
arm logs 507f1f77bcf86cd799439011
arm logs a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6 --follow
```

Options:
- `-f, --follow` - Follow log output (real-time)
- `-n, --lines <number>` - Number of lines to show (default: 50)

### Configuration

#### `arm config:set <key> <value>`
Set configuration value
```bash
arm config:set apiUrl http://localhost:5000/api
arm config:set defaultTunnelPort 8080
```

#### `arm config:get [key]`
Get configuration value (omit key to show all)
```bash
arm config:get apiUrl
arm config:get
```

#### `arm config:delete <key>`
Delete configuration value
```bash
arm config:delete apiUrl
```

## Configuration

Configuration is stored in `~/.config/arm-cli/config.json`

Default configuration:
```json
{
  "apiUrl": "http://localhost:5000/api",
  "token": null,
  "userId": null,
  "email": null,
  "defaultTunnelPort": 3000,
  "defaultWebhookExpiry": 86400
}
```

## Examples

### Expose Local Development Server
```bash
# Login
arm login

# Start tunnel on port 3000 with custom subdomain
arm tunnel 3000 --subdomain myapp

# Your local server is now accessible at:
# https://myapp.free-tunnelapi.app

# Output:
# 🚇 Starting Tunnel...
# ✔ Tunnel created successfully!
# ┌─────────────────────────────────────────────┐
# │  Tunnel Information                         │
# ├─────────────────────────────────────────────┤
# │  Name:        myapp                         │
# │  Public URL:  https://myapp.free-tunnelapi.app│
# │  Local Port:  3000                          │
# └─────────────────────────────────────────────┘
# 🎉 Tunnel Active!
```

### Tunnel Timeouts (Industry Standard)
| Setting | Value | Description |
|---------|-------|-------------|
| Heartbeat | 30 seconds | CLI sends keepalive every 30s |
| Idle Timeout | 2 hours | Closes after 2 hours of no requests |
| Max Session | 24 hours | Requires reconnect after 24 hours |

### Secure Tunnel with OAuth Authentication
```bash
# Create HTTPS tunnel
arm tunnel 3000 --protocol https --ssl --subdomain myapi

# Configure Google OAuth
arm tunnel:auth:oauth <tunnel-id> \
  --provider google \
  --client-id YOUR_GOOGLE_CLIENT_ID \
  --client-secret YOUR_GOOGLE_SECRET \
  --callback-url https://myapi.tunnel.arm.dev/auth/callback

# Now your tunnel requires Google login to access
```

### TCP Tunnel for Database
```bash
# Expose PostgreSQL database
arm tunnel 5432 --protocol tcp --subdomain mydb

# Connect from anywhere:
# psql -h mydb.tunnel.arm.dev -p 5432 -U username -d database
```

### Multi-Service Routing with Ingress
```bash
# Create tunnel
arm tunnel 3000 --protocol https --ssl

# Configure path-based routing
arm tunnel:ingress <tunnel-id> \
  "/api/v1=localhost:3000,/api/v2=localhost:4000,/admin=localhost:5000" \
  --tls

# Now:
# https://yourtunnel.arm.dev/api/v1 -> localhost:3000
# https://yourtunnel.arm.dev/api/v2 -> localhost:4000
# https://yourtunnel.arm.dev/admin -> localhost:5000
```

### Test Webhooks Locally
```bash
# Create webhook that forwards to local server
arm webhook --forward http://localhost:4000/webhook --name "Test Webhook"

# Send test request
curl -X POST <webhook-url> -d '{"test": "data"}'

# View logs
arm webhook:logs <webhook-id>
```

### CI/CD Integration
```bash
# In your CI/CD pipeline
export ARM_TOKEN="your-auth-token"

# Start tunnel for testing
arm tunnel 3000 --subdomain ci-test-${CI_BUILD_ID}

# Run your tests against the public URL
npm test

# Stop tunnel
arm tunnel:stop <tunnel-id>
```

## Troubleshooting

### Authentication Issues
```bash
# Check if logged in
arm config:get email

# Re-login
arm logout
arm login
```

### Connection Issues
```bash
# Check API URL
arm config:get apiUrl

# Update API URL
arm config:set apiUrl https://your-api-url.com/api
```

### View All Configuration
```bash
arm config:get
```

## Troubleshooting

### Command Not Found After Installation

If you get `arm: command not found` after installing:

**Windows:**
1. Check npm prefix: `npm config get prefix`
2. Add to PATH: `C:\Users\<YourUsername>\AppData\Roaming\npm`
3. Restart terminal

**macOS/Linux:**
```bash
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Alternative - Use npx:**
```bash
npx api-response-manager login
```

## Publishing to npm

See [PUBLISHING.md](./PUBLISHING.md) for detailed instructions on publishing this package to npm.

### Quick Publish

```bash
# Login to npm
npm login

# Update version
npm version patch  # or minor/major

# Publish
npm publish --access public
```

## Support

- GitHub: https://github.com/vijaypurohit322/api-response-manager
- Issues: https://github.com/vijaypurohit322/api-response-manager/issues
- Email: vijaypurohit322@gmail.com

## License

This software is proprietary. See [LICENSE](https://github.com/vijaypurohit322/api-response-manager/blob/main/LICENSE) for details.

**Key Points:**
- ✅ Personal and educational use allowed
- ✅ Self-hosting for non-commercial use allowed
- ❌ Commercial use requires separate license
- ❌ Resale or redistribution prohibited
- 📧 Contact: vijaypurohit322@gmail.com
