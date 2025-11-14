const Webhook = require('../models/Webhook');
const WebhookRequest = require('../models/WebhookRequest');
const Tunnel = require('../models/Tunnel');
const crypto = require('crypto');
const axios = require('axios');

// Generate unique webhook ID
const generateWebhookId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Get base URL from environment or default
const getBaseUrl = () => {
  return process.env.WEBHOOK_BASE_URL || 'http://localhost:5000/webhook';
};

// Create a new webhook
exports.createWebhook = async (req, res) => {
  try {
    const { name, description, forwarding, security, filters, retention, projectId, expiresIn } = req.body;

    // Generate unique webhook ID
    const webhookId = generateWebhookId();
    const webhookUrl = `${getBaseUrl()}/${webhookId}`;

    // Validate tunnel if forwarding to tunnel
    if (forwarding?.enabled && forwarding?.targetType === 'tunnel' && forwarding?.tunnelId) {
      const tunnel = await Tunnel.findOne({
        _id: forwarding.tunnelId,
        userId: req.user.id
      });

      if (!tunnel) {
        return res.status(404).json({ msg: 'Tunnel not found' });
      }
    }

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    const webhook = new Webhook({
      userId: req.user.id,
      name,
      description,
      webhookId,
      webhookUrl,
      forwarding: forwarding || {},
      security: security || {},
      filters: filters || {},
      retention: retention || {},
      projectId,
      expiresAt
    });

    await webhook.save();

    res.json({ 
      webhook,
      message: 'Webhook created successfully'
    });
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({ msg: 'Server error creating webhook' });
  }
};

// Get all webhooks for user
exports.getWebhooks = async (req, res) => {
  try {
    const { status, projectId } = req.query;

    const query = { userId: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (projectId) {
      query.projectId = projectId;
    }

    const webhooks = await Webhook.find(query)
      .sort({ createdAt: -1 })
      .populate('projectId', 'name')
      .populate('forwarding.tunnelId', 'subdomain publicUrl status');

    res.json({ webhooks });
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({ msg: 'Server error fetching webhooks' });
  }
};

// Get webhook by ID
exports.getWebhookById = async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
      .populate('projectId', 'name')
      .populate('forwarding.tunnelId', 'subdomain publicUrl status');

    if (!webhook) {
      return res.status(404).json({ msg: 'Webhook not found' });
    }

    res.json({ webhook });
  } catch (error) {
    console.error('Get webhook error:', error);
    res.status(500).json({ msg: 'Server error fetching webhook' });
  }
};

// Update webhook
exports.updateWebhook = async (req, res) => {
  try {
    const { name, description, status, forwarding, security, filters, retention } = req.body;

    const webhook = await Webhook.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!webhook) {
      return res.status(404).json({ msg: 'Webhook not found' });
    }

    // Validate tunnel if forwarding to tunnel
    if (forwarding?.enabled && forwarding?.targetType === 'tunnel' && forwarding?.tunnelId) {
      const tunnel = await Tunnel.findOne({
        _id: forwarding.tunnelId,
        userId: req.user.id
      });

      if (!tunnel) {
        return res.status(404).json({ msg: 'Tunnel not found' });
      }
    }

    // Update fields
    if (name) webhook.name = name;
    if (description !== undefined) webhook.description = description;
    if (status) webhook.status = status;
    if (forwarding) webhook.forwarding = { ...webhook.forwarding, ...forwarding };
    if (security) webhook.security = { ...webhook.security, ...security };
    if (filters) webhook.filters = { ...webhook.filters, ...filters };
    if (retention) webhook.retention = { ...webhook.retention, ...retention };

    await webhook.save();

    res.json({ 
      webhook,
      message: 'Webhook updated successfully'
    });
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({ msg: 'Server error updating webhook' });
  }
};

// Delete webhook
exports.deleteWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!webhook) {
      return res.status(404).json({ msg: 'Webhook not found' });
    }

    // Optionally delete associated requests
    await WebhookRequest.deleteMany({ webhookId: webhook._id });

    res.json({ msg: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ msg: 'Server error deleting webhook' });
  }
};

// Get webhook statistics
exports.getWebhookStats = async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!webhook) {
      return res.status(404).json({ msg: 'Webhook not found' });
    }

    // Get request counts by status
    const [totalRequests, forwardedCount, failedCount, recentRequests] = await Promise.all([
      WebhookRequest.countDocuments({ webhookId: webhook._id }),
      WebhookRequest.countDocuments({ webhookId: webhook._id, status: 'forwarded' }),
      WebhookRequest.countDocuments({ webhookId: webhook._id, status: 'failed' }),
      WebhookRequest.find({ webhookId: webhook._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('method status createdAt forwarding.duration')
    ]);

    res.json({
      stats: {
        totalRequests,
        forwardedCount,
        failedCount,
        successRate: totalRequests > 0 ? ((forwardedCount / totalRequests) * 100).toFixed(2) : 0,
        lastRequestAt: webhook.stats.lastRequestAt,
        recentRequests
      }
    });
  } catch (error) {
    console.error('Get webhook stats error:', error);
    res.status(500).json({ msg: 'Server error fetching stats' });
  }
};

// Get webhook requests (history)
exports.getWebhookRequests = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const webhook = await Webhook.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!webhook) {
      return res.status(404).json({ msg: 'Webhook not found' });
    }

    const query = { webhookId: webhook._id };
    if (status) {
      query.status = status;
    }

    const [requests, total] = await Promise.all([
      WebhookRequest.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean(),
      WebhookRequest.countDocuments(query)
    ]);

    // Convert Map objects to plain objects for JSON serialization
    const serializedRequests = requests.map(req => {
      try {
        return {
          ...req,
          headers: req.headers && typeof req.headers === 'object' ? 
            (req.headers instanceof Map ? Object.fromEntries(req.headers) : req.headers) : {},
          query: req.query && typeof req.query === 'object' ? 
            (req.query instanceof Map ? Object.fromEntries(req.query) : req.query) : {},
          forwarding: req.forwarding ? {
            ...req.forwarding,
            responseHeaders: req.forwarding.responseHeaders && typeof req.forwarding.responseHeaders === 'object' ? 
              (req.forwarding.responseHeaders instanceof Map ? Object.fromEntries(req.forwarding.responseHeaders) : req.forwarding.responseHeaders) : {}
          } : {}
        };
      } catch (err) {
        console.error('Error serializing request:', err, req);
        return req; // Return original if serialization fails
      }
    });

    res.json({ 
      requests: serializedRequests,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get webhook requests error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ msg: 'Server error fetching requests', error: error.message });
  }
};

// Get single webhook request
exports.getWebhookRequest = async (req, res) => {
  try {
    const request = await WebhookRequest.findOne({
      _id: req.params.requestId,
      userId: req.user.id
    });

    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Get webhook request error:', error);
    res.status(500).json({ msg: 'Server error fetching request' });
  }
};

// Replay webhook request
exports.replayWebhookRequest = async (req, res) => {
  try {
    const originalRequest = await WebhookRequest.findOne({
      _id: req.params.requestId,
      userId: req.user.id
    });

    if (!originalRequest) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    const webhook = await Webhook.findById(originalRequest.webhookId);

    if (!webhook) {
      return res.status(404).json({ msg: 'Webhook not found' });
    }

    // Create replay request
    const replayRequest = await originalRequest.createReplay();

    // Forward if enabled
    if (webhook.forwarding.enabled) {
      await forwardWebhookRequest(webhook, replayRequest);
    }

    res.json({ 
      request: replayRequest,
      message: 'Webhook replayed successfully'
    });
  } catch (error) {
    console.error('Replay webhook error:', error);
    res.status(500).json({ msg: 'Server error replaying webhook' });
  }
};

// Receive incoming webhook (public endpoint)
exports.receiveWebhook = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { webhookId } = req.params;

    // Find webhook
    const webhook = await Webhook.findActiveByWebhookId(webhookId);

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Check if webhook is expired
    if (webhook.isExpired) {
      webhook.status = 'expired';
      await webhook.save();
      return res.status(410).json({ error: 'Webhook expired' });
    }

    // Validate method
    if (webhook.filters.allowedMethods && webhook.filters.allowedMethods.length > 0) {
      if (!webhook.filters.allowedMethods.includes(req.method)) {
        return res.status(405).json({ error: 'Method not allowed' });
      }
    }

    // Validate IP whitelist
    if (webhook.security.ipWhitelist && webhook.security.ipWhitelist.length > 0) {
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
      if (!webhook.security.ipWhitelist.includes(clientIp)) {
        return res.status(403).json({ error: 'IP not whitelisted' });
      }
    }

    // Validate authentication
    if (webhook.security.requireAuth) {
      if (webhook.security.authType === 'token') {
        const token = req.headers['x-webhook-token'] || req.query.token;
        if (token !== webhook.security.authToken) {
          return res.status(401).json({ error: 'Invalid authentication token' });
        }
      }
    }

    // Create webhook request record
    const webhookRequest = new WebhookRequest({
      webhookId: webhook._id,
      userId: webhook.userId,
      method: req.method,
      url: req.originalUrl,
      headers: Object.fromEntries(Object.entries(req.headers)),
      body: req.body,
      rawBody: req.rawBody,
      query: Object.fromEntries(Object.entries(req.query)),
      clientIp: req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    await webhookRequest.save();

    // Increment webhook stats
    await webhook.incrementRequests();

    // Forward if enabled
    if (webhook.forwarding.enabled) {
      // Forward asynchronously
      forwardWebhookRequest(webhook, webhookRequest).catch(err => {
        console.error('Forward error:', err);
      });
    }

    // Return success immediately
    res.status(200).json({ 
      success: true,
      message: 'Webhook received',
      requestId: webhookRequest._id
    });

  } catch (error) {
    console.error('Receive webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to forward webhook request
async function forwardWebhookRequest(webhook, webhookRequest) {
  const startTime = Date.now();
  
  try {
    let targetUrl = '';

    console.log('🔄 Forwarding webhook:', {
      enabled: webhook.forwarding.enabled,
      targetType: webhook.forwarding.targetType,
      tunnelId: webhook.forwarding.tunnelId
    });

    if (webhook.forwarding.targetType === 'tunnel') {
      const tunnel = await Tunnel.findById(webhook.forwarding.tunnelId);
      console.log('🚇 Tunnel found:', tunnel ? { id: tunnel._id, status: tunnel.status, url: tunnel.publicUrl } : 'null');
      
      if (!tunnel || tunnel.status !== 'active') {
        throw new Error('Tunnel not active or not found');
      }
      
      // For local development, forward to localhost:localPort
      // In production, this would use the actual public URL
      const tunnelServerUrl = process.env.TUNNEL_SERVER_URL || 'http://localhost:9000';
      const path = webhookRequest.url.split('?')[0].replace(`/webhook/${webhook.webhookId}`, '') || '/';
      
      // Forward directly to the local port
      targetUrl = `http://localhost:${tunnel.localPort}${path}`;
      
      console.log('🎯 Forwarding directly to local port:', targetUrl);
    } else if (webhook.forwarding.targetType === 'url') {
      targetUrl = webhook.forwarding.targetUrl;
    } else {
      console.log('⚠️ No forwarding configured');
      return;
    }

    console.log('📤 Forwarding to:', targetUrl);

    webhookRequest.forwarding.targetUrl = targetUrl;

    // Forward request
    const response = await axios({
      method: webhookRequest.method.toLowerCase(),
      url: targetUrl,
      headers: webhookRequest.headers,
      data: webhookRequest.body,
      timeout: webhook.forwarding.timeout,
      validateStatus: () => true
    });

    const duration = Date.now() - startTime;

    console.log('✅ Forward successful:', { status: response.status, duration });

    // Mark as forwarded
    await webhookRequest.markForwarded(
      response.status,
      Object.fromEntries(Object.entries(response.headers)),
      response.data,
      duration
    );

    await webhook.incrementSuccessfulForwards();

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ Forward failed:', error.message);
    
    await webhookRequest.markFailed(error.message, duration);
    await webhook.incrementFailedForwards();
  }
}

module.exports = {
  createWebhook: exports.createWebhook,
  getWebhooks: exports.getWebhooks,
  getWebhookById: exports.getWebhookById,
  updateWebhook: exports.updateWebhook,
  deleteWebhook: exports.deleteWebhook,
  getWebhookStats: exports.getWebhookStats,
  getWebhookRequests: exports.getWebhookRequests,
  getWebhookRequest: exports.getWebhookRequest,
  replayWebhookRequest: exports.replayWebhookRequest,
  receiveWebhook: exports.receiveWebhook,
  forwardWebhookRequest
};
