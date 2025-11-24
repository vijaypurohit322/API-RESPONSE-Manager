const axios = require('axios');
const crypto = require('crypto');

class OAuthHandler {
  constructor() {
    this.sessions = new Map();
  }

  // Generate OAuth authorization URL
  generateAuthUrl(tunnel, provider) {
    const state = crypto.randomBytes(16).toString('hex');
    this.sessions.set(state, {
      tunnelId: tunnel._id,
      provider,
      createdAt: Date.now()
    });

    const config = tunnel.authentication.oauth;
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackUrl,
      response_type: 'code',
      state,
      scope: config.scope.join(' ')
    });

    const authUrls = {
      google: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      github: `https://github.com/login/oauth/authorize?${params}`,
      microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`,
      custom: `${config.authorizationUrl}?${params}`
    };

    return authUrls[provider];
  }

  // Handle OAuth callback
  async handleCallback(code, state) {
    const session = this.sessions.get(state);
    if (!session) {
      throw new Error('Invalid or expired state');
    }

    this.sessions.delete(state);

    const tunnel = await this.getTunnel(session.tunnelId);
    const config = tunnel.authentication.oauth;

    // Exchange code for access token
    const tokenResponse = await this.exchangeCodeForToken(
      code,
      config,
      session.provider
    );

    // Get user info
    const userInfo = await this.getUserInfo(
      tokenResponse.access_token,
      session.provider
    );

    return {
      success: true,
      user: userInfo,
      accessToken: tokenResponse.access_token
    };
  }

  async exchangeCodeForToken(code, config, provider) {
    const tokenUrls = {
      google: 'https://oauth2.googleapis.com/token',
      github: 'https://github.com/login/oauth/access_token',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      custom: config.tokenUrl
    };

    const response = await axios.post(tokenUrls[provider], {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.callbackUrl,
      grant_type: 'authorization_code'
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  async getUserInfo(accessToken, provider) {
    const userInfoUrls = {
      google: 'https://www.googleapis.com/oauth2/v2/userinfo',
      github: 'https://api.github.com/user',
      microsoft: 'https://graph.microsoft.com/v1.0/me',
      custom: null // Custom provider should specify userInfoUrl
    };

    const response = await axios.get(userInfoUrls[provider], {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data;
  }

  async getTunnel(tunnelId) {
    const Tunnel = require('../models/Tunnel');
    return await Tunnel.findById(tunnelId);
  }

  // Cleanup expired sessions (older than 10 minutes)
  cleanupSessions() {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [state, session] of this.sessions.entries()) {
      if (session.createdAt < tenMinutesAgo) {
        this.sessions.delete(state);
      }
    }
  }
}

module.exports = new OAuthHandler();
