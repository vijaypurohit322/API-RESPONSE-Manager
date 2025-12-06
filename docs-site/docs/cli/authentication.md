---
sidebar_position: 2
title: Authentication
description: Login methods for the ARM CLI
---

# CLI Authentication

The ARM CLI supports multiple authentication methods including OAuth providers.

## Interactive Login (Recommended)

```bash
arm login
```

This presents an interactive menu:

```
? Choose login method:
❯ Email & Password
  Google
  GitHub
  Microsoft
```

## Email & Password

```bash
arm login -e your@email.com -p yourpassword
```

Or interactively:

```bash
arm login
# Select "Email & Password"
# Enter your credentials
```

## OAuth Login

### Google

```bash
arm login --provider google
```

### GitHub

```bash
arm login --provider github
```

### Microsoft

```bash
arm login --provider microsoft
```

## How OAuth Works

1. CLI generates a unique device code
2. Opens your browser to the authentication page
3. You authenticate with your OAuth provider
4. CLI receives the token automatically
5. Credentials are stored securely in `~/.armrc`

## Check Login Status

```bash
arm whoami
```

Output:
```
Logged in as: john@example.com
User ID: 507f1f77bcf86cd799439011
Plan: Team
```

## Logout

```bash
arm logout
```

This clears stored credentials from `~/.armrc`.

## Token Management

### View Current Token

```bash
arm config get token
```

### Use Environment Variable

```bash
export ARM_TOKEN=your-jwt-token
arm tunnel 3000
```

### Token Expiration

Tokens expire after 7 days. The CLI will prompt you to re-authenticate when needed.

## Headless/CI Authentication

For CI/CD pipelines, use environment variables:

```bash
# In your CI config
export ARM_TOKEN=${{ secrets.ARM_TOKEN }}

# Run commands
arm tunnel 3000 --subdomain ci-preview
```

### Generating a Long-Lived Token

1. Login via the web dashboard at https://tunnelapi.in
2. Go to Settings → API Tokens
3. Generate a new token
4. Use in CI/CD

## Troubleshooting

### "Authentication required" Error

```bash
# Re-authenticate
arm logout
arm login
```

### OAuth Browser Doesn't Open

```bash
# Manual OAuth flow
arm login --provider google --no-browser
# Copy the URL and open manually
```

### Token Invalid

```bash
# Clear and re-login
rm ~/.armrc
arm login
```

## Security Best Practices

1. **Never commit tokens** - Use environment variables in CI
2. **Rotate tokens regularly** - Generate new tokens periodically
3. **Use OAuth** - More secure than password authentication
4. **Logout on shared machines** - Always run `arm logout`
