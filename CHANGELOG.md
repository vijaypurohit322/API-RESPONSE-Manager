# Changelog

All notable changes to this project will be documented in this file.

## [2.3.0] - 2025-11-25

### Added - Social Authentication
- **Google OAuth Login** - Sign in with Google account (Web UI + CLI)
- **GitHub OAuth Login** - Sign in with GitHub account (Web UI + CLI)
- **Microsoft OAuth Login** - Sign in with Microsoft account (Web UI + CLI)
- **OAuth Device Flow** - CLI authentication via browser
  - Device code generation and verification
  - Automatic browser opening
  - Token polling with timeout
  - Device authentication page at `/device`
- Social login buttons on Login and Register pages
- Automatic account creation and linking by email
- Profile picture support from social accounts
- OAuth callback handlers for all providers (Google, GitHub, Microsoft)
- Complete setup documentation:
  - SOCIAL_AUTH_SETUP.md - General OAuth setup
  - GOOGLE_OAUTH_SETUP.md - Google-specific guide
  - GITHUB_LOGIN_SETUP.md - GitHub-specific guide
  - SAML_SECURITY.md - SAML key management

### Added - Advanced Tunneling Features
- **Protocol Support** - HTTP, HTTPS, TCP, WebSocket (WS/WSS)
- **Custom Domains** - Configure custom domain names for tunnels
- **SSL/TLS Certificates** - Upload custom SSL certificates
- **OAuth Authentication** - Protect tunnels with OAuth (Google, GitHub, Microsoft)
- **OIDC Authentication** - OpenID Connect support for enterprise
- **SAML Authentication** - SAML SSO integration
- **Ingress/Gateway** - Path-based routing to multiple backends
- **CLI Commands** - Complete tunnel management from command line
  - `arm tunnel:domain` - Set custom domain
  - `arm tunnel:ssl` - Upload SSL certificates
  - `arm tunnel:auth:oauth` - Configure OAuth
  - `arm tunnel:auth:oidc` - Configure OIDC
  - `arm tunnel:auth:saml` - Configure SAML
  - `arm tunnel:ingress` - Configure ingress rules

### Fixed
- Environment variable loading in backend (added `dotenv` configuration)
- JWT secret consistency across authentication methods
- Duplicate OAuth callback requests in React StrictMode
- Token validation for social login users
- Google OAuth flow - Now supports both ID token (web) and code exchange (CLI)
- Google Sign-In button loading issue - Switched to standard OAuth flow
- SAML private key security - Environment-based key loading with example key
- Device authentication flow - Proper approval and token exchange

### Changed
- Updated User model with social auth fields (provider, providerId, avatar, emailVerified)
- Enhanced CLI README with advanced tunnel commands and examples
- Updated main README with social login and advanced tunneling features
- Updated FEATURES.md with comprehensive feature list

### Documentation
- Created SOCIAL_AUTH_SETUP.md - Complete OAuth setup guide
- Created GOOGLE_OAUTH_SETUP.md - Google OAuth setup with troubleshooting
- Created GITHUB_LOGIN_SETUP.md - GitHub-specific setup guide
- Created SAML_SECURITY.md - SAML private key security best practices
- Created CLI_UPDATES.md - CLI changes documentation
- Updated README.md with v2.3.0 features
- Updated FEATURES.md with social auth and tunneling features
- Created frontend/.env.example with OAuth variables

## [2.2.0] - 2025-11-14

### Added - Webhook Testing Suite (Phase 2.2)
- Slack integration for webhook notifications
- Discord integration for webhook notifications
- Email alerts configuration
- Event-based notification triggers

### Added - Webhook Testing Suite (Phase 2.1)
- HMAC signature validation (SHA-1/256/512)
- Request modification and resend functionality
- Multiple destination forwarding
- Conditional forwarding rules
- Payload transformation

## [2.1.0] - 2025-11-10

### Added - Webhook Testing Suite (Phase 2.0)
- Instant webhook URL generation
- Automatic request logging
- Webhook forwarding to tunnels/URLs
- Request history with filtering
- Replay functionality
- Statistics dashboard
- Request inspection UI

## [2.0.3] - 2025-11-05

### Added
- Dark/Light theme toggle
- System preference auto-detection
- Theme persistence via localStorage
- Mobile sidebar improvements

## [2.0.0] - 2025-11-01

### Added - Live Tunneling Service
- Expose local APIs with public URLs
- Custom subdomain support
- WebSocket tunneling with auto-reconnect
- Rate limiting per tunnel
- Security features (IP whitelisting, auth)
- SSL/TLS support with Let's Encrypt
- Statistics tracking
- Complete UI for tunnel management
- Tunnel expiration and auto-cleanup
- Heartbeat monitoring

### Added - Core Features
- User authentication (JWT-based)
- Project management
- API response capturing via proxy
- Shareable project links
- Comments system
- Real-time updates
- Modern responsive UI

## [1.0.0] - 2025-10-15

### Initial Release
- Basic API response capturing
- Project organization
- Simple sharing functionality
