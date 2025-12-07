---
sidebar_position: 1
title: Installation
description: Install the TunnelAPI CLI on macOS, Linux, or Windows
---

# Installation

Install the TunnelAPI CLI to start creating tunnels and webhooks from your terminal.

## Requirements

- **Node.js** v14 or later
- **npm** v6 or later

## Install from npm (Recommended)

```bash
npm install -g api-response-manager
```

Verify the installation:

```bash
arm --version
arm --help
```

## Install from Source

Clone the repository and link the CLI:

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

## Use with npx (No Installation)

Run commands without installing:

```bash
npx api-response-manager login
npx api-response-manager tunnel 3000
npx api-response-manager webhook
```

## Platform-Specific Notes

### macOS

Works out of the box with Homebrew-installed Node.js or the official installer.

### Linux

Ensure Node.js is installed via your package manager or nvm:

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install ARM CLI
npm install -g api-response-manager
```

### Windows

Use PowerShell or Command Prompt. For best experience, use Windows Terminal.

```powershell
npm install -g api-response-manager
arm --version
```

## Updating

Update to the latest version:

```bash
npm update -g api-response-manager
```

## Uninstalling

Remove the CLI:

```bash
npm uninstall -g api-response-manager
```

## Next Steps

- [Quick Start](/getting-started/quick-start) - Create your first tunnel
- [Authentication](/cli/authentication) - Login to your account
