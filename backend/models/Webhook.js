const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Unique identifier for the webhook URL
  webhookId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Public webhook URL (e.g., https://arm.dev/webhook/abc123)
  webhookUrl: {
    type: String,
    required: true
  },
  // Status: active, paused, expired
  status: {
    type: String,
    enum: ['active', 'paused', 'expired'],
    default: 'active',
    index: true
  },
  // Forwarding configuration
  forwarding: {
    enabled: {
      type: Boolean,
      default: false
    },
    // Forward to tunnel or direct URL
    targetType: {
      type: String,
      enum: ['tunnel', 'url', 'none'],
      default: 'none'
    },
    // Tunnel ID if forwarding to tunnel
    tunnelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tunnel'
    },
    // Direct URL if forwarding to URL
    targetUrl: {
      type: String
    },
    // Forward timeout in ms
    timeout: {
      type: Number,
      default: 30000
    }
  },
  // Security settings
  security: {
    // Require authentication
    requireAuth: {
      type: Boolean,
      default: false
    },
    // Authentication type
    authType: {
      type: String,
      enum: ['none', 'token', 'signature'],
      default: 'none'
    },
    // Auth token
    authToken: {
      type: String
    },
    // Signature secret for validation
    signatureSecret: {
      type: String
    },
    // IP whitelist
    ipWhitelist: [{
      type: String
    }]
  },
  // Request filtering
  filters: {
    // Only accept specific HTTP methods
    allowedMethods: [{
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      default: 'POST'
    }],
    // Only accept specific content types
    allowedContentTypes: [{
      type: String
    }]
  },
  // Statistics
  stats: {
    totalRequests: {
      type: Number,
      default: 0
    },
    successfulForwards: {
      type: Number,
      default: 0
    },
    failedForwards: {
      type: Number,
      default: 0
    },
    lastRequestAt: {
      type: Date
    }
  },
  // Project association (optional)
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  // Retention settings
  retention: {
    // Keep requests for N days
    keepDays: {
      type: Number,
      default: 7
    },
    // Max requests to keep
    maxRequests: {
      type: Number,
      default: 1000
    }
  },
  // Expiration
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for cleanup of expired webhooks
webhookSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for finding active webhooks
webhookSchema.index({ userId: 1, status: 1 });

// Virtual for checking if webhook is expired
webhookSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Method to increment request count
webhookSchema.methods.incrementRequests = function() {
  this.stats.totalRequests += 1;
  this.stats.lastRequestAt = new Date();
  return this.save();
};

// Method to increment successful forwards
webhookSchema.methods.incrementSuccessfulForwards = function() {
  this.stats.successfulForwards += 1;
  return this.save();
};

// Method to increment failed forwards
webhookSchema.methods.incrementFailedForwards = function() {
  this.stats.failedForwards += 1;
  return this.save();
};

// Static method to find active webhook by webhookId
webhookSchema.statics.findActiveByWebhookId = function(webhookId) {
  return this.findOne({ 
    webhookId, 
    status: 'active' 
  });
};

module.exports = mongoose.model('Webhook', webhookSchema);
