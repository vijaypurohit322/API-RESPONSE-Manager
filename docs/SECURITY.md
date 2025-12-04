# Security Documentation

## Overview

API Response Manager follows industry-standard security practices aligned with **ISO 27001** and **OWASP** guidelines.

## Security Features

### 1. Authentication & Authorization

#### JWT Token Security
- **Algorithm**: HS256 (HMAC-SHA256)
- **Token Expiry**: 7 days maximum
- **Secret Requirements**: Minimum 32 characters
- **Token Format Validation**: Strict JWT format checking

#### Authorization Levels
| Endpoint Type | Auth Required | Ownership Check |
|---------------|---------------|-----------------|
| Public (share links) | No | N/A |
| Protected | Yes (JWT) | Yes |
| Admin | Yes (JWT + Role) | Yes |

### 2. Input Validation

All user inputs are validated and sanitized:

- **ObjectId Validation**: MongoDB ObjectIds are validated before database queries
- **String Sanitization**: XSS characters (`<`, `>`) are stripped
- **Length Limits**: All string inputs have maximum length limits
- **Type Checking**: Strict type validation for all parameters

### 3. API Security

#### Rate Limiting
- **Global**: 100 requests per 15 minutes per IP
- **Auth Endpoints**: 5 requests per 15 minutes per IP
- **Share Links**: 30 requests per 15 minutes per IP

#### CORS Policy
- Whitelisted origins only
- Credentials supported for authenticated requests
- Preflight caching enabled

#### Security Headers
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### 4. Data Protection

#### Sensitive Data Handling
- Passwords are hashed using bcrypt (10 rounds)
- JWT secrets are environment-based
- No sensitive data in error messages (production mode)
- Share tokens are cryptographically random (32 bytes)

#### Database Security
- MongoDB connection with authentication
- Query parameterization (no raw queries)
- ObjectId validation prevents injection

### 5. Tunnel Security

#### Connection Security
- WebSocket connections require authentication
- Heartbeat mechanism for connection validation
- Automatic cleanup of stale connections

#### Timeouts (Industry Standard)
| Setting | Value | Purpose |
|---------|-------|---------|
| Heartbeat | 30 seconds | Connection keepalive |
| Idle Timeout | 2 hours | Resource cleanup |
| Max Session | 24 hours | Security rotation |

#### Enterprise Authentication (SAML/OAuth/OIDC)

Tunnels support enterprise-grade authentication:

**SAML 2.0 SSO**
- SP-initiated authentication flow
- Signed assertions required
- Session management with 24-hour expiry
- Automatic session cleanup

**Configuration:**
```bash
# Configure SAML for a tunnel
POST /api/tunnels/:id/auth/saml
{
  "entryPoint": "https://idp.example.com/sso",
  "issuer": "https://your-app.tunnelapi.in",
  "cert": "-----BEGIN CERTIFICATE-----...",
  "callbackUrl": "https://tunnel.tunnelapi.in/auth/saml/callback"
}
```

**SAML Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/saml/login` | GET | Initiate SAML login |
| `/auth/saml/callback` | POST | Handle IdP response |
| `/auth/saml/metadata/:tunnelId` | GET | SP metadata XML |
| `/auth/saml/verify` | GET | Verify session |
| `/auth/saml/logout` | POST | Logout and clear session |

### 6. Error Handling

#### Production Mode
- Generic error messages (no stack traces)
- Structured error responses
- Audit logging for security events

#### Error Response Format
```json
{
  "msg": "User-friendly message",
  "error": "Technical description (dev only)"
}
```

## Security Checklist

### API Endpoints
- [x] All protected routes require JWT authentication
- [x] Ownership verification on all resource access
- [x] Input validation on all parameters
- [x] Rate limiting on all endpoints
- [x] CORS properly configured

### Authentication
- [x] Secure password hashing (bcrypt)
- [x] JWT with expiry and algorithm restriction
- [x] Token format validation
- [x] Secure error messages (no information leakage)

### Data Handling
- [x] XSS prevention (input sanitization)
- [x] SQL/NoSQL injection prevention
- [x] Sensitive data not logged
- [x] Environment-based secrets

### Infrastructure
- [x] HTTPS enforced (SSL/TLS)
- [x] Security headers configured
- [x] Rate limiting enabled
- [x] CORS whitelist

## Reporting Security Issues

If you discover a security vulnerability, please report it to:
- Email: vijaypurohit322@gmail.com
- Subject: [SECURITY] API Response Manager

Please do not disclose security issues publicly until they have been addressed.

## Compliance

### ISO 27001 Implementation

| Control | Implementation |
|---------|----------------|
| A.9.4.3 Password Management | Strong password policy (8+ chars, uppercase, lowercase, number, special char) |
| A.12.4.1 Event Logging | Winston logger with structured audit logs |
| A.14.1.2 Securing Application Services | Helmet.js security headers, HTTPS enforcement |
| A.14.2.5 Secure System Engineering | Input validation, parameterized queries |

### OWASP Top 10 (2021) Mitigations

| Risk | Mitigation |
|------|------------|
| A01:2021 Broken Access Control | JWT authentication, ownership verification |
| A02:2021 Cryptographic Failures | bcrypt (12 rounds), HS256 JWT, TLS 1.2+ |
| A03:2021 Injection | Input validation, MongoDB parameterization |
| A04:2021 Insecure Design | Security-first architecture, rate limiting |
| A05:2021 Security Misconfiguration | Helmet.js, CSP, HSTS, no debug in production |
| A06:2021 Vulnerable Components | Regular dependency updates, npm audit |
| A07:2021 Auth Failures | Strong passwords, timing-attack prevention |
| A08:2021 Software Integrity | Package-lock.json, integrity checks |
| A09:2021 Logging Failures | Structured logging, audit trails |
| A10:2021 SSRF | URL validation, restricted outbound requests |

### GDPR Compliance

| Article | Implementation | Endpoint |
|---------|----------------|----------|
| Article 15 - Right of Access | Data export in JSON format | `GET /api/gdpr/export` |
| Article 17 - Right to Erasure | Complete account deletion | `DELETE /api/gdpr/delete-account` |
| Article 20 - Data Portability | Machine-readable export | `GET /api/gdpr/export` |
| Article 30 - Records of Processing | Data categories endpoint | `GET /api/gdpr/data-categories` |

**Data Retention:**
- User data: Until account deletion
- Server logs: 30 days
- Tunnel sessions: 24 hours max

**Data Controller Contact:** vijaypurohit322@gmail.com

## Version

Security documentation version: 2.5.0
Last updated: December 4, 2025
