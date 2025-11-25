# SAML Security Configuration

## Overview

The SAML authentication handler requires a private key for signing SAML requests. This guide explains how to properly configure it for development and production environments.

## ⚠️ Security Warning

**NEVER commit real private keys to version control!**

The example key in `samlHandler.js` is intentionally truncated and marked as an example. It will not work for actual SAML authentication.

## Development Setup

For development/testing, the code will use the example key and display a warning:

```
WARNING: Using example SAML private key. Set SAML_PRIVATE_KEY environment variable in production!
```

This is acceptable for local development but **must not be used in production**.

## Production Setup

### Step 1: Generate a Private Key

```bash
# Generate a 2048-bit RSA private key
openssl genrsa -out saml-private-key.pem 2048

# Generate the corresponding public certificate
openssl req -new -x509 -key saml-private-key.pem -out saml-certificate.pem -days 365
```

### Step 2: Store the Key Securely

**Option A: Environment Variable (Recommended)**

Convert the key to a single line with `\n` for line breaks:

```bash
# Linux/Mac
export SAML_PRIVATE_KEY=$(cat saml-private-key.pem | sed ':a;N;$!ba;s/\n/\\n/g')

# Or add to .env file
echo "SAML_PRIVATE_KEY=$(cat saml-private-key.pem | sed ':a;N;$!ba;s/\n/\\n/g')" >> .env
```

**Option B: Secret Management Service**

For production, use a secret management service:
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- Google Cloud Secret Manager

### Step 3: Configure Environment

Add to your `.env` file:

```env
# SAML Private Key (use \n for line breaks)
SAML_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w...\n-----END PRIVATE KEY-----
```

### Step 4: Verify Configuration

The application will automatically:
1. Check for `SAML_PRIVATE_KEY` environment variable
2. Use it if present
3. Fall back to example key with warning if not set

## Docker Deployment

### Using Docker Secrets

```yaml
# docker-compose.yml
services:
  tunnel-server:
    secrets:
      - saml_private_key
    environment:
      SAML_PRIVATE_KEY_FILE: /run/secrets/saml_private_key

secrets:
  saml_private_key:
    file: ./secrets/saml-private-key.pem
```

### Using Environment Variables

```yaml
# docker-compose.yml
services:
  tunnel-server:
    environment:
      SAML_PRIVATE_KEY: ${SAML_PRIVATE_KEY}
```

## Kubernetes Deployment

```yaml
# Create secret
kubectl create secret generic saml-keys \
  --from-file=private-key=saml-private-key.pem

# Use in deployment
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: tunnel-server
    env:
    - name: SAML_PRIVATE_KEY
      valueFrom:
        secretKeyRef:
          name: saml-keys
          key: private-key
```

## Key Rotation

Best practices for key rotation:

1. **Generate new key pair** (as shown in Step 1)
2. **Update IdP configuration** with new certificate
3. **Deploy new key** to environment
4. **Verify** SAML authentication works
5. **Remove old key** after grace period

Recommended rotation schedule: Every 12 months

## Troubleshooting

### Warning: "Using example SAML private key"

**Cause:** `SAML_PRIVATE_KEY` environment variable is not set

**Solution:** Set the environment variable with your real private key

### SAML Authentication Fails

**Possible causes:**
1. Private key doesn't match public certificate in IdP
2. Key format is incorrect (missing `\n` line breaks)
3. Key is expired or invalid

**Debug steps:**
```bash
# Verify key format
openssl rsa -in saml-private-key.pem -check

# Check certificate matches key
openssl x509 -in saml-certificate.pem -noout -modulus | openssl md5
openssl rsa -in saml-private-key.pem -noout -modulus | openssl md5
# These should match
```

## Security Checklist

- [ ] Private key generated with sufficient length (2048+ bits)
- [ ] Private key stored in secure location (not in code)
- [ ] Environment variable or secret manager used
- [ ] Key not committed to version control
- [ ] `.gitignore` includes `*.pem` files
- [ ] Key rotation schedule established
- [ ] Access to keys restricted to authorized personnel
- [ ] Backup of keys stored securely

## References

- [SAML 2.0 Specification](https://docs.oasis-open.org/security/saml/v2.0/)
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
