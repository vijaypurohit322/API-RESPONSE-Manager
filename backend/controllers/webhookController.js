const Webhook = require('../models/Webhook');
const WebhookRequest = require('../models/WebhookRequest');
const Tunnel = require('../models/Tunnel');
const crypto = require('crypto');
const axios = require('axios');

// Helper function to validate webhook signature
const validateSignature = (payload, signature, secret, algorithm = 'sha256', encoding = 'hex') => {
  try {
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest(encoding);
    
    // Remove algorithm prefix if present (e.g., "sha256=...")
    const cleanSignature = signature.includes('=') ? signature.split('=')[1] : signature;
    
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, encoding),
      Buffer.from(expectedSignature, encoding)
    );
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
};

// Helper function to evaluate conditional rules
const evaluateCondition = (condition, request) => {
  try {
    const { field, operator, value } = condition;
    
    // Get field value from request (supports nested paths like 'body.event')
    const getFieldValue = (obj, path) => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };
    
    const fieldValue = getFieldValue(request, field);
    
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'startsWith':
        return String(fieldValue).startsWith(String(value));
      case 'endsWith':
        return String(fieldValue).endsWith(String(value));
      case 'regex':
        return new RegExp(value).test(String(fieldValue));
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'greaterThan':
        return Number(fieldValue) > Number(value);
      case 'lessThan':
        return Number(fieldValue) < Number(value);
      default:
        return false;
    }
  } catch (error) {
    console.error('Condition evaluation error:', error);
    return false;
  }
};

// Helper function to check if forwarding rules match
const checkForwardingRules = (webhook, webhookRequest) => {
  if (!webhook.forwardingRules || webhook.forwardingRules.length === 0) {
    return { shouldForward: true, destinations: [] };
  }

  const request = {
    body: webhookRequest.body,
    headers: webhookRequest.headers,
    method: webhookRequest.method,
    query: webhookRequest.query
  };

  for (const rule of webhook.forwardingRules) {
    if (!rule.enabled) continue;

    // Check if all conditions match
    const allConditionsMatch = rule.conditions.every(condition => 
      evaluateCondition(condition, request)
    );

    if (allConditionsMatch) {
      if (rule.action === 'skip') {
        return { shouldForward: false, destinations: [] };
      }
      if (rule.action === 'forward' && rule.destinations?.length > 0) {
        return { shouldForward: true, destinations: rule.destinations };
      }
    }
  }

  return { shouldForward: true, destinations: [] };
};

// Helper function to transform payload
const transformPayload = (webhook, body) => {
  if (!webhook.transformation?.enabled) {
    return body;
  }

  let transformed = JSON.parse(JSON.stringify(body)); // Deep clone

  const { mappings, removeFields, addFields, template } = webhook.transformation;

  // Apply template if provided
  if (template) {
    try {
      transformed = JSON.parse(template);
    } catch (error) {
      console.error('Template parsing error:', error);
    }
  }

  // Apply field mappings
  if (mappings && mappings.length > 0) {
    mappings.forEach(mapping => {
      const getValue = (obj, path) => path.split('.').reduce((curr, key) => curr?.[key], obj);
      const setValue = (obj, path, value) => {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((curr, key) => {
          if (!curr[key]) curr[key] = {};
          return curr[key];
        }, obj);
        target[lastKey] = value;
      };

      let value = getValue(body, mapping.from);

      // Apply transformation
      if (mapping.transform && value !== undefined) {
        switch (mapping.transform) {
          case 'uppercase':
            value = String(value).toUpperCase();
            break;
          case 'lowercase':
            value = String(value).toLowerCase();
            break;
          case 'trim':
            value = String(value).trim();
            break;
          case 'json':
            try {
              value = JSON.parse(value);
            } catch (e) {}
            break;
          case 'base64':
            value = Buffer.from(String(value)).toString('base64');
            break;
        }
      }

      if (value !== undefined) {
        setValue(transformed, mapping.to, value);
      }
    });
  }

  // Remove fields
  if (removeFields && removeFields.length > 0) {
    removeFields.forEach(field => {
      const keys = field.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((curr, key) => curr?.[key], transformed);
      if (target) delete target[lastKey];
    });
  }

  // Add fields
  if (addFields && addFields.length > 0) {
    addFields.forEach(({ path, value }) => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((curr, key) => {
        if (!curr[key]) curr[key] = {};
        return curr[key];
      }, transformed);
      target[lastKey] = value;
    });
  }

  return transformed;
};

// Helper function to send notifications
const sendNotifications = async (webhook, webhookRequest, event) => {
  const { notifications } = webhook;
  if (!notifications) return;

  const message = {
    webhook: webhook.name,
    event,
    method: webhookRequest.method,
    timestamp: new Date().toISOString(),
    requestId: webhookRequest._id
  };

  // Slack notification
  if (notifications.slack?.enabled && notifications.slack.events?.includes(event)) {
    try {
      await axios.post(notifications.slack.webhookUrl, {
        channel: notifications.slack.channel,
        text: `🪝 Webhook ${event}: ${webhook.name}`,
        attachments: [{
          color: event === 'failed' ? 'danger' : event === 'forwarded' ? 'good' : '#439FE0',
          fields: [
            { title: 'Method', value: webhookRequest.method, short: true },
            { title: 'Status', value: event, short: true },
            { title: 'Time', value: new Date().toLocaleString(), short: false }
          ]
        }]
      });
      console.log('📤 Slack notification sent');
    } catch (error) {
      console.error('Slack notification error:', error.message);
    }
  }

  // Discord notification
  if (notifications.discord?.enabled && notifications.discord.events?.includes(event)) {
    try {
      const color = event === 'failed' ? 15158332 : event === 'forwarded' ? 3066993 : 4437377;
      await axios.post(notifications.discord.webhookUrl, {
        embeds: [{
          title: `🪝 Webhook ${event}`,
          description: webhook.name,
          color,
          fields: [
            { name: 'Method', value: webhookRequest.method, inline: true },
            { name: 'Status', value: event, inline: true },
            { name: 'Time', value: new Date().toLocaleString(), inline: false }
          ],
          timestamp: new Date().toISOString()
        }]
      });
      console.log('📤 Discord notification sent');
    } catch (error) {
      console.error('Discord notification error:', error.message);
    }
  }

  // Email notification (placeholder - requires email service setup)
  if (notifications.email?.enabled && notifications.email.events?.includes(event)) {
    console.log('📧 Email notification queued for:', notifications.email.recipients);
    // TODO: Implement email sending with nodemailer or similar
  }
};

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
    const { name, description, forwarding, security, filters, retention, projectId, expiresIn, notifications } = req.body;

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
      notifications: notifications || {},
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

    // Try to find by webhookId first (public ID), then by MongoDB _id
    let webhook;
    if (req.params.id.length === 32) {
      // It's a webhookId (32 char hex)
      webhook = await Webhook.findOne({
        webhookId: req.params.id,
        userId: req.user.id
      });
    } else {
      // It's a MongoDB _id (24 char hex)
      webhook = await Webhook.findOne({
        _id: req.params.id,
        userId: req.user.id
      });
    }

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
    if (filters) webhook.filters = filters;
    if (retention !== undefined) webhook.retention = retention;
    if (req.body.notifications) webhook.notifications = req.body.notifications;

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

// Resend webhook with modifications
exports.resendWebhookRequest = async (req, res) => {
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

    // Get modifications from request body
    const { headers, body, method } = req.body;

    // Create modified request
    const modifiedRequest = new WebhookRequest({
      webhookId: webhook._id,
      userId: webhook.userId,
      method: method || originalRequest.method,
      url: originalRequest.url,
      headers: headers || originalRequest.headers,
      body: body || originalRequest.body,
      rawBody: JSON.stringify(body || originalRequest.body),
      query: originalRequest.query,
      clientIp: originalRequest.clientIp,
      userAgent: originalRequest.userAgent,
      replay: {
        isReplay: true,
        originalRequestId: originalRequest._id,
        replayCount: (originalRequest.replay?.replayCount || 0) + 1
      },
      status: 'replayed'
    });

    await modifiedRequest.save();

    // Forward if enabled
    if (webhook.forwarding.enabled) {
      await forwardWebhookRequest(webhook, modifiedRequest);
    }

    res.json({ 
      request: modifiedRequest,
      message: 'Modified webhook sent successfully'
    });
  } catch (error) {
    console.error('Resend webhook error:', error);
    res.status(500).json({ msg: 'Server error resending webhook' });
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

    // Validate signature if enabled
    if (webhook.security.signatureValidation?.enabled) {
      const signatureHeader = req.headers[webhook.security.signatureValidation.headerName.toLowerCase()];
      
      if (!signatureHeader) {
        return res.status(401).json({ error: 'Missing signature header' });
      }

      const isValid = validateSignature(
        req.rawBody,
        signatureHeader,
        webhook.security.signatureValidation.secret,
        webhook.security.signatureValidation.algorithm,
        webhook.security.signatureValidation.encoding
      );

      if (!isValid) {
        console.log('❌ Signature validation failed');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      console.log('✅ Signature validated successfully');
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

    // Store signature validation info
    let signatureInfo = {};
    if (webhook.security.signatureValidation?.enabled) {
      const signatureHeader = req.headers[webhook.security.signatureValidation.headerName.toLowerCase()];
      signatureInfo = {
        provided: signatureHeader,
        valid: true, // Already validated above
        algorithm: webhook.security.signatureValidation.algorithm
      };
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
      userAgent: req.headers['user-agent'],
      signature: signatureInfo
    });

    await webhookRequest.save();

    // Increment webhook stats
    await webhook.incrementRequests();

    // Send notification for received event
    console.log('🔔 Checking notifications:', {
      hasNotifications: !!webhook.notifications,
      slack: webhook.notifications?.slack?.enabled,
      discord: webhook.notifications?.discord?.enabled,
      email: webhook.notifications?.email?.enabled
    });
    
    sendNotifications(webhook, webhookRequest, 'received').catch(err => {
      console.error('Notification error:', err);
    });

    // Check forwarding rules
    const ruleResult = checkForwardingRules(webhook, webhookRequest);
    
    // Forward if enabled and rules allow
    if (webhook.forwarding.enabled && ruleResult.shouldForward) {
      // Forward asynchronously with rule-based destinations
      forwardWebhookRequest(webhook, webhookRequest, ruleResult.destinations).catch(err => {
        console.error('Forward error:', err);
      });
    } else if (!ruleResult.shouldForward) {
      console.log('⏭️ Skipped forwarding due to conditional rules');
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
async function forwardWebhookRequest(webhook, webhookRequest, ruleDestinations = []) {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Forwarding webhook:', {
      enabled: webhook.forwarding.enabled,
      targetType: webhook.forwarding.targetType,
      tunnelId: webhook.forwarding.tunnelId
    });

    // Apply payload transformation
    const transformedBody = transformPayload(webhook, webhookRequest.body);
    if (webhook.transformation?.enabled) {
      console.log('🔄 Payload transformed');
    }

    // Handle multiple destinations
    if (webhook.forwarding.targetType === 'multiple' && webhook.forwarding.destinations?.length > 0) {
      const results = [];
      
      for (const dest of webhook.forwarding.destinations) {
        if (!dest.enabled) continue;
        
        const destStartTime = Date.now();
        let targetUrl = '';
        
        try {
          if (dest.type === 'tunnel') {
            const tunnel = await Tunnel.findById(dest.tunnelId);
            if (!tunnel || tunnel.status !== 'active') {
              throw new Error('Tunnel not active');
            }
            const path = webhookRequest.url.split('?')[0].replace(`/webhook/${webhook.webhookId}`, '') || '/';
            targetUrl = `http://localhost:${tunnel.localPort}${path}`;
          } else if (dest.type === 'url') {
            targetUrl = dest.url;
          }

          const response = await axios({
            method: webhookRequest.method.toLowerCase(),
            url: targetUrl,
            headers: webhookRequest.headers,
            data: transformedBody,
            timeout: webhook.forwarding.timeout,
            validateStatus: () => true
          });

          const duration = Date.now() - destStartTime;
          
          results.push({
            name: dest.name || targetUrl,
            targetUrl,
            success: true,
            statusCode: response.status,
            duration
          });

          console.log(`✅ Forwarded to ${dest.name}: ${response.status} (${duration}ms)`);
        } catch (error) {
          const duration = Date.now() - destStartTime;
          
          results.push({
            name: dest.name || targetUrl,
            targetUrl,
            success: false,
            error: error.message,
            duration
          });

          console.error(`❌ Failed to forward to ${dest.name}:`, error.message);
        }
      }

      // Update webhook request with all results
      webhookRequest.forwarding = {
        attempted: true,
        success: results.every(r => r.success),
        destinations: results,
        duration: Date.now() - startTime
      };
      webhookRequest.status = results.every(r => r.success) ? 'forwarded' : 'failed';
      await webhookRequest.save();

      if (results.every(r => r.success)) {
        await webhook.incrementSuccessfulForwards();
        sendNotifications(webhook, webhookRequest, 'forwarded').catch(err => {
          console.error('Notification error:', err);
        });
      } else {
        await webhook.incrementFailedForwards();
        sendNotifications(webhook, webhookRequest, 'failed').catch(err => {
          console.error('Notification error:', err);
        });
      }
      
      return;
    }

    // Handle single destination (legacy)
    let targetUrl = '';

    if (webhook.forwarding.targetType === 'tunnel') {
      const tunnel = await Tunnel.findById(webhook.forwarding.tunnelId);
      console.log('🚇 Tunnel found:', tunnel ? { id: tunnel._id, status: tunnel.status, url: tunnel.publicUrl } : 'null');
      
      if (!tunnel || tunnel.status !== 'active') {
        throw new Error('Tunnel not active or not found');
      }
      
      const path = webhookRequest.url.split('?')[0].replace(`/webhook/${webhook.webhookId}`, '') || '/';
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

    await webhookRequest.markForwarded(
      response.status,
      Object.fromEntries(Object.entries(response.headers)),
      response.data,
      duration
    );

    await webhook.incrementSuccessfulForwards();
    sendNotifications(webhook, webhookRequest, 'forwarded').catch(err => {
      console.error('Notification error:', err);
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ Forward failed:', error.message);
    
    await webhookRequest.markFailed(error.message, duration);
    await webhook.incrementFailedForwards();
    sendNotifications(webhook, webhookRequest, 'failed').catch(err => {
      console.error('Notification error:', err);
    });
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
  resendWebhookRequest: exports.resendWebhookRequest,
  receiveWebhook: exports.receiveWebhook,
  forwardWebhookRequest
};
