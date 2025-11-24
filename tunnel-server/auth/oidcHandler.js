const { Issuer, generators } = require('openid-client');
const crypto = require('crypto');

class OIDCHandler {
  constructor() {
    this.clients = new Map();
    this.sessions = new Map();
  }

  // Initialize OIDC client for a tunnel
  async initializeClient(tunnel) {
    const config = tunnel.authentication.oidc;
    
    try {
      const issuer = await Issuer.discover(config.issuer);
      
      const client = new issuer.Client({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uris: [config.callbackUrl],
        response_types: ['code']
      });

      this.clients.set(tunnel._id.toString(), client);
      return client;
    } catch (error) {
      console.error('Error initializing OIDC client:', error);
      throw error;
    }
  }

  // Generate OIDC authorization URL
  async generateAuthUrl(tunnel) {
    let client = this.clients.get(tunnel._id.toString());
    
    if (!client) {
      client = await this.initializeClient(tunnel);
    }

    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    const nonce = generators.nonce();

    this.sessions.set(state, {
      tunnelId: tunnel._id,
      codeVerifier,
      nonce,
      createdAt: Date.now()
    });

    const authUrl = client.authorizationUrl({
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce
    });

    return authUrl;
  }

  // Handle OIDC callback
  async handleCallback(params, tunnel) {
    const session = this.sessions.get(params.state);
    
    if (!session) {
      throw new Error('Invalid or expired state');
    }

    this.sessions.delete(params.state);

    let client = this.clients.get(tunnel._id.toString());
    
    if (!client) {
      client = await this.initializeClient(tunnel);
    }

    const tokenSet = await client.callback(
      tunnel.authentication.oidc.callbackUrl,
      params,
      {
        code_verifier: session.codeVerifier,
        state: params.state,
        nonce: session.nonce
      }
    );

    const claims = tokenSet.claims();

    return {
      success: true,
      user: {
        id: claims.sub,
        email: claims.email,
        name: claims.name,
        picture: claims.picture
      },
      accessToken: tokenSet.access_token,
      idToken: tokenSet.id_token
    };
  }

  // Verify ID token
  async verifyToken(tunnel, idToken) {
    let client = this.clients.get(tunnel._id.toString());
    
    if (!client) {
      client = await this.initializeClient(tunnel);
    }

    try {
      const tokenSet = await client.validateIdToken({ id_token: idToken });
      return {
        valid: true,
        claims: tokenSet.claims()
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Cleanup expired sessions
  cleanupSessions() {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [state, session] of this.sessions.entries()) {
      if (session.createdAt < tenMinutesAgo) {
        this.sessions.delete(state);
      }
    }
  }
}

module.exports = new OIDCHandler();
