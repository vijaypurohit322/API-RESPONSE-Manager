# ARM CLI Installation Guide

Complete guide for installing and setting up the ARM CLI on your system.

## Prerequisites

- **Node.js**: Version 14.0.0 or higher
- **npm**: Comes with Node.js

Check your versions:
```bash
node --version
npm --version
```

## Installation Methods

### Method 1: Global Installation from npm (Recommended)

Install the CLI globally to use it from anywhere:

```bash
npm install -g @arm/cli
```

Verify installation:
```bash
arm --version
arm --help
```

**Updating:**
```bash
npm update -g @arm/cli
```

**Uninstalling:**
```bash
npm uninstall -g @arm/cli
```

---

### Method 2: Install from Source (For Development)

Clone and install from the repository:

```bash
# 1. Clone the repository
git clone https://github.com/vijaypurohit322/api-response-manager.git
cd api-response-manager/cli

# 2. Install dependencies
npm install

# 3. Link globally
npm link

# 4. Verify installation
arm --version
```

**Updating from source:**
```bash
cd api-response-manager/cli
git pull
npm install
```

**Unlinking:**
```bash
npm unlink -g @arm/cli
```

---

### Method 3: Use with npx (No Installation Required)

Run commands without installing:

```bash
npx @arm/cli login
npx @arm/cli tunnel 3000
npx @arm/cli projects
```

**Pros:**
- No installation needed
- Always uses latest version
- No global namespace pollution

**Cons:**
- Slower (downloads package each time)
- Requires internet connection

---

## First-Time Setup

After installation, configure the CLI:

### 1. Login to ARM

```bash
arm login
```

Enter your email and password when prompted.

### 2. Configure API URL (Optional)

If your backend is not on localhost:5000:

```bash
arm config:set apiUrl https://your-api-domain.com/api
```

### 3. Configure Web URL (Optional)

For shareable project links:

```bash
arm config:set webUrl https://your-frontend-domain.com
```

### 4. Verify Configuration

```bash
arm config:get
```

---

## Platform-Specific Instructions

### Windows

**Using PowerShell:**
```powershell
npm install -g @arm/cli
arm --version
```

**Using Command Prompt:**
```cmd
npm install -g @arm/cli
arm --version
```

**Troubleshooting:**
- If you get permission errors, run as Administrator
- Add npm global bin to PATH: `C:\Users\<YourUsername>\AppData\Roaming\npm`

---

### macOS

**Using Terminal:**
```bash
sudo npm install -g @arm/cli
arm --version
```

**Troubleshooting:**
- If you get EACCES errors, fix npm permissions:
  ```bash
  mkdir ~/.npm-global
  npm config set prefix '~/.npm-global'
  echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bash_profile
  source ~/.bash_profile
  ```

---

### Linux

**Using Terminal:**
```bash
sudo npm install -g @arm/cli
arm --version
```

**For Ubuntu/Debian:**
```bash
# Install Node.js if not installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install ARM CLI
sudo npm install -g @arm/cli
```

**Troubleshooting:**
- Fix npm permissions (avoid using sudo):
  ```bash
  mkdir ~/.npm-global
  npm config set prefix '~/.npm-global'
  echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
  source ~/.bashrc
  npm install -g @arm/cli
  ```

---

## Docker Installation (Optional)

Run ARM CLI in a Docker container:

```dockerfile
FROM node:18-alpine

# Install ARM CLI
RUN npm install -g @arm/cli

# Set working directory
WORKDIR /app

# Default command
CMD ["arm", "--help"]
```

Build and run:
```bash
docker build -t arm-cli .
docker run -it arm-cli arm login
```

---

## Verification

Test your installation:

```bash
# Check version
arm --version

# View help
arm --help

# Login
arm login

# List projects
arm projects

# Create a tunnel
arm tunnel 3000
```

---

## Configuration Files

ARM CLI stores configuration in:

- **Windows**: `C:\Users\<YourUsername>\AppData\Roaming\arm-cli\config.json`
- **macOS**: `~/Library/Preferences/arm-cli/config.json`
- **Linux**: `~/.config/arm-cli/config.json`

View config location:
```bash
arm config:get
```

---

## Troubleshooting

### Command Not Found

**Issue:** `arm: command not found`

**Solution:**
1. Check if npm global bin is in PATH:
   ```bash
   npm config get prefix
   ```
2. Add to PATH (varies by OS)
3. Restart terminal

### Permission Errors

**Issue:** `EACCES: permission denied`

**Solution:**
- **Windows**: Run as Administrator
- **macOS/Linux**: Use `sudo` or fix npm permissions (see platform-specific instructions)

### Module Not Found

**Issue:** `Cannot find module 'commander'`

**Solution:**
```bash
cd $(npm root -g)/@arm/cli
npm install
```

### Version Mismatch

**Issue:** Old version still running

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm uninstall -g @arm/cli
npm install -g @arm/cli
```

---

## Getting Help

- **Documentation**: [README.md](./README.md)
- **Publishing Guide**: [PUBLISHING.md](./PUBLISHING.md)
- **GitHub Issues**: https://github.com/vijaypurohit322/api-response-manager/issues
- **Email**: vijaypurohit322@gmail.com

---

## Next Steps

After installation:

1. ✅ Login: `arm login`
2. ✅ Create a project: `arm project:create "My Project"`
3. ✅ Start a tunnel: `arm tunnel 3000`
4. ✅ Create a webhook: `arm webhook`
5. ✅ Explore commands: `arm --help`

Happy coding! 🚀
