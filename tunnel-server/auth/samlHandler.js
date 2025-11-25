const saml2 = require('saml2-js');
const crypto = require('crypto');

class SAMLHandler {
  constructor() {
    this.serviceProviders = new Map();
    this.identityProviders = new Map();
    this.sessions = new Map();
  }

  // Initialize SAML for a tunnel
  initializeSAML(tunnel) {
    const config = tunnel.authentication.saml;
    const tunnelId = tunnel._id.toString();

    // Create service provider
    const sp = new saml2.ServiceProvider({
      entity_id: config.issuer,
      private_key: this.generatePrivateKey(),
      certificate: config.cert,
      assert_endpoint: config.callbackUrl,
      allow_unencrypted_assertion: false
    });

    // Create identity provider
    const idp = new saml2.IdentityProvider({
      sso_login_url: config.entryPoint,
      sso_logout_url: config.logoutUrl || config.entryPoint,
      certificates: [config.cert]
    });

    this.serviceProviders.set(tunnelId, sp);
    this.identityProviders.set(tunnelId, idp);

    return { sp, idp };
  }

  // Generate SAML login URL
  async generateLoginUrl(tunnel, relayState) {
    const tunnelId = tunnel._id.toString();
    let sp = this.serviceProviders.get(tunnelId);
    let idp = this.identityProviders.get(tunnelId);

    if (!sp || !idp) {
      const saml = this.initializeSAML(tunnel);
      sp = saml.sp;
      idp = saml.idp;
    }

    return new Promise((resolve, reject) => {
      sp.create_login_request_url(idp, { relay_state: relayState }, (err, loginUrl) => {
        if (err) {
          reject(err);
        } else {
          resolve(loginUrl);
        }
      });
    });
  }

  // Handle SAML assertion
  async handleAssertion(tunnel, samlResponse) {
    const tunnelId = tunnel._id.toString();
    let sp = this.serviceProviders.get(tunnelId);
    let idp = this.identityProviders.get(tunnelId);

    if (!sp || !idp) {
      const saml = this.initializeSAML(tunnel);
      sp = saml.sp;
      idp = saml.idp;
    }

    return new Promise((resolve, reject) => {
      sp.post_assert(idp, { request_body: { SAMLResponse: samlResponse } }, (err, samlAssert) => {
        if (err) {
          reject(err);
        } else {
          const user = {
            nameID: samlAssert.user.name_id,
            email: samlAssert.user.email,
            attributes: samlAssert.user.attributes
          };

          // Create session
          const sessionId = crypto.randomBytes(32).toString('hex');
          this.sessions.set(sessionId, {
            tunnelId,
            user,
            createdAt: Date.now()
          });

          resolve({
            success: true,
            user,
            sessionId
          });
        }
      });
    });
  }

  // Verify SAML session
  verifySession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { valid: false, error: 'Session not found' };
    }

    // Check if session is expired (24 hours)
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (session.createdAt < twentyFourHoursAgo) {
      this.sessions.delete(sessionId);
      return { valid: false, error: 'Session expired' };
    }

    return {
      valid: true,
      user: session.user
    };
  }

  // Generate logout URL
  async generateLogoutUrl(tunnel, sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    const tunnelId = tunnel._id.toString();
    let sp = this.serviceProviders.get(tunnelId);
    let idp = this.identityProviders.get(tunnelId);

    if (!sp || !idp) {
      const saml = this.initializeSAML(tunnel);
      sp = saml.sp;
      idp = saml.idp;
    }

    return new Promise((resolve, reject) => {
      sp.create_logout_request_url(idp, { name_id: session.user.nameID }, (err, logoutUrl) => {
        if (err) {
          reject(err);
        } else {
          this.sessions.delete(sessionId);
          resolve(logoutUrl);
        }
      });
    });
  }

  generatePrivateKey() {
    // Load from environment variable or secure storage
    if (process.env.SAML_PRIVATE_KEY) {
      return process.env.SAML_PRIVATE_KEY.replace(/\\n/g, '\n');
    }

    // Development/testing only - generate a new key or use example
    console.warn('WARNING: Using example SAML private key. Set SAML_PRIVATE_KEY environment variable in production!');
    
    // This is an example/dummy key for development only
    // In production, generate a real key with: openssl genrsa -out private-key.pem 2048
    return `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDEXAMPLE...
(This is a truncated example key - replace with real key in production)
-----END PRIVATE KEY-----`;
  }

  // Cleanup expired sessions
  cleanupSessions() {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.createdAt < twentyFourHoursAgo) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = new SAMLHandler();
