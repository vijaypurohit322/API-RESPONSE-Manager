# Publishing ARM CLI to npm

This guide explains how to publish the `@arm/cli` package to npm.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **npm Login**: Login to npm from your terminal
   ```bash
   npm login
   ```

## Publishing Steps

### 1. Prepare for Publishing

Update version in `package.json`:
```bash
cd cli
npm version patch  # or minor, or major
```

### 2. Test Locally

Before publishing, test the package locally:
```bash
# Install dependencies
npm install

# Link globally for testing
npm link

# Test commands
arm --version
arm --help
arm login
```

### 3. Publish to npm

```bash
# Publish the package
npm publish --access public
```

**Note**: The `--access public` flag is required for scoped packages (@arm/cli) to be publicly accessible.

### 4. Verify Publication

Check that your package is live:
```bash
npm view @arm/cli
```

Visit: https://www.npmjs.com/package/@arm/cli

## Version Management

Follow semantic versioning (semver):
- **Patch** (1.0.x): Bug fixes
  ```bash
  npm version patch
  ```
- **Minor** (1.x.0): New features (backward compatible)
  ```bash
  npm version minor
  ```
- **Major** (x.0.0): Breaking changes
  ```bash
  npm version major
  ```

## Publishing Updates

When you make changes:

```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Publish
npm publish

# 3. Tag the release in git
git tag v1.0.1
git push origin v1.0.1
```

## Unpublishing (Emergency Only)

If you need to unpublish (within 72 hours):
```bash
npm unpublish @arm/cli@1.0.0
```

**Warning**: Unpublishing is discouraged. Use `npm deprecate` instead:
```bash
npm deprecate @arm/cli@1.0.0 "This version has a critical bug. Please upgrade."
```

## Setting Up Organization (Optional)

If you want to publish under an organization:

1. Create organization on npm: https://www.npmjs.com/org/create
2. Update `package.json`:
   ```json
   {
     "name": "@your-org/cli"
   }
   ```

## CI/CD Publishing (GitHub Actions)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: cd cli && npm install
      - run: cd cli && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add `NPM_TOKEN` to GitHub repository secrets.

## Troubleshooting

### Package Name Already Taken
If `@arm/cli` is taken, use a different name:
```json
{
  "name": "@your-username/arm-cli"
}
```

### Permission Denied
Make sure you're logged in and have access:
```bash
npm whoami
npm owner ls @arm/cli
```

### 2FA Required
If you have 2FA enabled, you'll need to enter your OTP:
```bash
npm publish --otp=123456
```

## Best Practices

1. **Test Before Publishing**: Always test with `npm link` first
2. **Update CHANGELOG**: Document changes in each version
3. **Tag Releases**: Use git tags for version tracking
4. **Semantic Versioning**: Follow semver strictly
5. **README**: Keep README.md up to date with latest features
6. **Dependencies**: Keep dependencies updated and secure

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm CLI Documentation](https://docs.npmjs.com/cli/)
