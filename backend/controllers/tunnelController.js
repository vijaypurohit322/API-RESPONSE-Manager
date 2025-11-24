const Tunnel = require('../models/Tunnel');
const crypto = require('crypto');

// Generate a random subdomain
const generateSubdomain = () => {
  return crypto.randomBytes(4).toString('hex');
};

// Get base URL from environment or default
const getBaseUrl = () => {
  return process.env.TUNNEL_BASE_URL || 'tunnel.arm.dev';
};

// Create a new tunnel
exports.createTunnel = async (req, res) => {
  try {
    const { localPort, subdomain, projectId, rateLimit, authentication, expiresIn } = req.body;

    // Validate local port
    if (!localPort || localPort < 1 || localPort > 65535) {
      return res.status(400).json({ msg: 'Invalid local port' });
    }

    // Generate or validate subdomain
    let tunnelSubdomain = subdomain;
    if (!tunnelSubdomain) {
      tunnelSubdomain = generateSubdomain();
    } else {
      // Validate subdomain format
      if (!/^[a-z0-9-]+$/.test(tunnelSubdomain)) {
        return res.status(400).json({ msg: 'Invalid subdomain format. Use only lowercase letters, numbers, and hyphens.' });
      }

      // Check if subdomain is already taken
      const existing = await Tunnel.findOne({ subdomain: tunnelSubdomain.toLowerCase() });
      if (existing) {
        return res.status(409).json({ msg: 'Subdomain already taken' });
      }
    }

    // Calculate expiration
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    // Create public URL
    const publicUrl = `https://${tunnelSubdomain}.${getBaseUrl()}`;

    // Create tunnel
    const tunnel = new Tunnel({
      userId: req.user.id,
      projectId: projectId || null,
      subdomain: tunnelSubdomain.toLowerCase(),
      localPort,
      publicUrl,
      status: 'connecting',
      rateLimit: rateLimit || { requestsPerMinute: 60, enabled: true },
      authentication: authentication || { enabled: false, type: 'none' },
      expiresAt
    });

    await tunnel.save();

    res.status(201).json({
      tunnel: {
        id: tunnel._id,
        subdomain: tunnel.subdomain,
        publicUrl: tunnel.publicUrl,
        localPort: tunnel.localPort,
        status: tunnel.status,
        createdAt: tunnel.createdAt,
        expiresAt: tunnel.expiresAt
      }
    });
  } catch (error) {
    console.error('Create tunnel error:', error);
    res.status(500).json({ msg: 'Server error creating tunnel' });
  }
};

// Get all tunnels for the authenticated user
exports.getTunnels = async (req, res) => {
  try {
    const { status, projectId } = req.query;
    
    const query = { userId: req.user.id };
    if (status) query.status = status;
    if (projectId) query.projectId = projectId;

    const tunnels = await Tunnel.find(query)
      .sort({ createdAt: -1 })
      .select('-authentication.password -authentication.token');

    res.json({ tunnels });
  } catch (error) {
    console.error('Get tunnels error:', error);
    res.status(500).json({ msg: 'Server error fetching tunnels' });
  }
};

// Get a specific tunnel by ID
exports.getTunnelById = async (req, res) => {
  try {
    const tunnel = await Tunnel.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).select('-authentication.password -authentication.token');

    if (!tunnel) {
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    res.json({ tunnel });
  } catch (error) {
    console.error('Get tunnel error:', error);
    res.status(500).json({ msg: 'Server error fetching tunnel' });
  }
};

// Update tunnel status (internal use by tunnel server)
exports.updateTunnelStatus = async (req, res) => {
  try {
    const { status, connectionId } = req.body;

    const tunnel = await Tunnel.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!tunnel) {
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    if (status) tunnel.status = status;
    if (connectionId) tunnel.connectionId = connectionId;
    tunnel.lastHeartbeat = new Date();

    await tunnel.save();

    res.json({ 
      tunnel: {
        id: tunnel._id,
        status: tunnel.status,
        lastHeartbeat: tunnel.lastHeartbeat
      }
    });
  } catch (error) {
    console.error('Update tunnel status error:', error);
    res.status(500).json({ msg: 'Server error updating tunnel' });
  }
};

// Delete/stop a tunnel
exports.deleteTunnel = async (req, res) => {
  try {
    const tunnel = await Tunnel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!tunnel) {
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    // TODO: Notify tunnel server to close the connection

    res.json({ msg: 'Tunnel deleted successfully' });
  } catch (error) {
    console.error('Delete tunnel error:', error);
    res.status(500).json({ msg: 'Server error deleting tunnel' });
  }
};

// Heartbeat endpoint for tunnel clients
exports.heartbeat = async (req, res) => {
  try {
    const tunnel = await Tunnel.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!tunnel) {
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    await tunnel.heartbeat();

    res.json({ 
      success: true,
      lastHeartbeat: tunnel.lastHeartbeat 
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get tunnel statistics
exports.getTunnelStats = async (req, res) => {
  try {
    const tunnel = await Tunnel.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!tunnel) {
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    res.json({
      stats: {
        requestCount: tunnel.requestCount,
        bytesTransferred: tunnel.bytesTransferred,
        uptime: Date.now() - tunnel.createdAt.getTime(),
        status: tunnel.status,
        lastHeartbeat: tunnel.lastHeartbeat
      }
    });
  } catch (error) {
    console.error('Get tunnel stats error:', error);
    res.status(500).json({ msg: 'Server error fetching stats' });
  }
};

// Check subdomain availability
exports.checkSubdomain = async (req, res) => {
  try {
    const { subdomain } = req.params;

    // Validate format
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return res.json({ 
        available: false, 
        reason: 'Invalid format. Use only lowercase letters, numbers, and hyphens.' 
      });
    }

    // Check if taken
    const existing = await Tunnel.findOne({ subdomain: subdomain.toLowerCase() });
    
    res.json({ 
      available: !existing,
      subdomain: subdomain.toLowerCase(),
      publicUrl: existing ? null : `https://${subdomain}.${getBaseUrl()}`
    });
  } catch (error) {
    console.error('Check subdomain error:', error);
    res.status(500).json({ msg: 'Server error checking subdomain' });
  }
};

// Increment tunnel statistics
exports.incrementStats = async (req, res) => {
  try {
    const { bytes } = req.body;
    
    console.log(`📊 Incrementing stats for tunnel ${req.params.id}: ${bytes} bytes`);

    const tunnel = await Tunnel.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!tunnel) {
      console.log('❌ Tunnel not found');
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    console.log(`Before: requests=${tunnel.requestCount}, bytes=${tunnel.bytesTransferred}`);
    await tunnel.incrementRequests(bytes || 0);
    console.log(`After: requests=${tunnel.requestCount}, bytes=${tunnel.bytesTransferred}`);

    res.json({ success: true });
  } catch (error) {
    console.error('Increment stats error:', error);
    res.status(500).json({ msg: 'Server error updating stats' });
  }
};

// Set custom domain for tunnel
exports.setCustomDomain = async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      return res.status(400).json({ msg: 'Invalid domain format' });
    }

    const tunnel = await Tunnel.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!tunnel) {
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    // Check if domain is already in use
    const existing = await Tunnel.findOne({ customDomain: domain });
    if (existing && existing._id.toString() !== tunnel._id.toString()) {
      return res.status(409).json({ msg: 'Domain already in use' });
    }

    tunnel.customDomain = domain;
    tunnel.publicUrl = `https://${domain}`;
    await tunnel.save();

    res.json(tunnel);
  } catch (error) {
    console.error('Set custom domain error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Upload SSL certificate
exports.uploadSSLCertificate = async (req, res) => {
  try {
    const { cert, key, ca } = req.body;

    if (!cert || !key) {
      return res.status(400).json({ msg: 'Certificate and key are required' });
    }

    const tunnel = await Tunnel.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!tunnel) {
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    tunnel.sslEnabled = true;
    tunnel.sslCertificate = {
      cert,
      key,
      ca: ca || null,
      autoGenerated: false
    };
    await tunnel.save();

    res.json({ msg: 'SSL certificate uploaded successfully' });
  } catch (error) {
    console.error('Upload SSL error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Configure OAuth authentication
exports.configureOAuth = async (req, res) => {
  try {
    const { provider, clientId, clientSecret, callbackUrl, scope } = req.body;

    const tunnel = await Tunnel.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!tunnel) {
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    tunnel.authentication = {
      enabled: true,
      type: 'oauth',
      oauth: {
        provider,
        clientId,
        clientSecret,
        callbackUrl,
        scope: scope || ['openid', 'email', 'profile']
      }
    };
    await tunnel.save();

    res.json({ msg: 'OAuth configured successfully', tunnel });
  } catch (error) {
    console.error('Configure OAuth error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Configure OIDC authentication
exports.configureOIDC = async (req, res) => {
  try {
    const { issuer, clientId, clientSecret, callbackUrl } = req.body;

    const tunnel = await Tunnel.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!tunnel) {
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    tunnel.authentication = {
      enabled: true,
      type: 'oidc',
      oidc: {
        issuer,
        clientId,
        clientSecret,
        callbackUrl
      }
    };
    await tunnel.save();

    res.json({ msg: 'OIDC configured successfully', tunnel });
  } catch (error) {
    console.error('Configure OIDC error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Configure SAML authentication
exports.configureSAML = async (req, res) => {
  try {
    const { entryPoint, issuer, cert, callbackUrl } = req.body;

    const tunnel = await Tunnel.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!tunnel) {
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    tunnel.authentication = {
      enabled: true,
      type: 'saml',
      saml: {
        entryPoint,
        issuer,
        cert,
        callbackUrl
      }
    };
    await tunnel.save();

    res.json({ msg: 'SAML configured successfully', tunnel });
  } catch (error) {
    console.error('Configure SAML error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Configure ingress rules
exports.configureIngress = async (req, res) => {
  try {
    const { enabled, rules, tls } = req.body;

    const tunnel = await Tunnel.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!tunnel) {
      return res.status(404).json({ msg: 'Tunnel not found' });
    }

    tunnel.ingress = {
      enabled: enabled !== undefined ? enabled : true,
      rules: rules || [],
      tls: tls || { enabled: false }
    };
    await tunnel.save();

    res.json({ msg: 'Ingress configured successfully', tunnel });
  } catch (error) {
    console.error('Configure ingress error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get OAuth authorization URL
exports.getOAuthUrl = async (req, res) => {
  try {
    const tunnel = await Tunnel.findById(req.params.id);

    if (!tunnel || !tunnel.authentication.oauth) {
      return res.status(404).json({ msg: 'OAuth not configured' });
    }

    const oauthHandler = require('../../tunnel-server/auth/oauthHandler');
    const authUrl = oauthHandler.generateAuthUrl(tunnel, tunnel.authentication.oauth.provider);

    res.json({ authUrl });
  } catch (error) {
    console.error('Get OAuth URL error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get OIDC authorization URL
exports.getOIDCUrl = async (req, res) => {
  try {
    const tunnel = await Tunnel.findById(req.params.id);

    if (!tunnel || !tunnel.authentication.oidc) {
      return res.status(404).json({ msg: 'OIDC not configured' });
    }

    const oidcHandler = require('../../tunnel-server/auth/oidcHandler');
    const authUrl = await oidcHandler.generateAuthUrl(tunnel);

    res.json({ authUrl });
  } catch (error) {
    console.error('Get OIDC URL error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get SAML login URL
exports.getSAMLUrl = async (req, res) => {
  try {
    const tunnel = await Tunnel.findById(req.params.id);

    if (!tunnel || !tunnel.authentication.saml) {
      return res.status(404).json({ msg: 'SAML not configured' });
    }

    const samlHandler = require('../../tunnel-server/auth/samlHandler');
    const loginUrl = await samlHandler.generateLoginUrl(tunnel, req.query.relayState);

    res.json({ loginUrl });
  } catch (error) {
    console.error('Get SAML URL error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};
