# ARM CLI - API Response Manager Command Line Interface

Command-line interface for API Response Manager. Manage tunnels, webhooks, and projects from your terminal.

## Installation

### Option 1: Install from npm (Recommended)
```bash
npm install -g @arm/cli
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
npx @arm/cli login
npx @arm/cli tunnel 3000
npx @arm/cli webhook
```

## Quick Start

### 1. Login
```bash
arm login
# Or provide credentials directly
arm login -e your@email.com -p yourpassword
```

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
```bash
arm login
arm login -e email@example.com -p password
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
arm tunnel 3000
arm tunnel 3000 --subdomain myapi --name "My API"
arm tunnel 3000 --auth --rate-limit 100
```

Options:
- `-s, --subdomain <subdomain>` - Custom subdomain
- `-n, --name <name>` - Tunnel name
- `-a, --auth` - Enable basic authentication
- `-r, --rate-limit <limit>` - Rate limit (requests per minute, default: 60)

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

# Start tunnel on port 3000
arm tunnel 3000 --subdomain myapp

# Your local server is now accessible at:
# https://myapp.tunnel.arm.dev
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

MIT License - see LICENSE file for details
