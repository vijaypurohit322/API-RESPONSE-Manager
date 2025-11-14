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
    targetType: {
      type: String,
      enum: ['none', 'tunnel', 'url', 'multiple'],
      default: 'none'
    },
    // Single destination (legacy)
    tunnelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tunnel'
    },
    targetUrl: {
      type: String
    },
    // Multiple destinations
    destinations: [{
      type: {
        type: String,
        enum: ['tunnel', 'url'],
        required: true
      },
      tunnelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tunnel'
      },
      url: {
        type: String
      },
      name: {
        type: String
      },
      enabled: {
        type: Boolean,
        default: true
      }
    }],
    timeout: {
      type: Number,
      default: 30000 // 30 seconds
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
      enum: ['none', 'token', 'basic'],
      default: 'none'
    },
    // Auth token
    authToken: {
      type: String
    },
    // Basic auth
    basicAuth: {
      username: String,
      password: String
    },
    // IP whitelist
    ipWhitelist: [{
      type: String
    }],
    // Signature validation
    signatureValidation: {
      enabled: {
        type: Boolean,
        default: false
      },
      algorithm: {
        type: String,
        enum: ['sha1', 'sha256', 'sha512'],
        default: 'sha256'
      },
      secret: {
        type: String
      },
      headerName: {
        type: String,
        default: 'x-hub-signature-256' // GitHub style
      },
      encoding: {
        type: String,
        enum: ['hex', 'base64'],
        default: 'hex'
      }
    }
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
  // Conditional forwarding rules
  forwardingRules: [{
    name: String,
    enabled: {
      type: Boolean,
      default: true
    },
    conditions: [{
      field: String, // e.g., 'body.event', 'headers.x-event-type'
      operator: {
        type: String,
        enum: ['equals', 'contains', 'startsWith', 'endsWith', 'regex', 'exists', 'greaterThan', 'lessThan']
      },
      value: mongoose.Schema.Types.Mixed
    }],
    action: {
      type: String,
      enum: ['forward', 'skip', 'transform'],
      default: 'forward'
    },
    destinations: [{
      type: String // Destination names to forward to
    }]
  }],
  // Payload transformation
  transformation: {
    enabled: {
      type: Boolean,
      default: false
    },
    mappings: [{
      from: String, // Source field path
      to: String,   // Destination field path
      transform: String // Optional: 'uppercase', 'lowercase', 'trim', 'json', 'base64'
    }],
    template: String, // JSON template for complete transformation
    removeFields: [String], // Fields to remove
    addFields: [{
      path: String,
      value: mongoose.Schema.Types.Mixed
    }]
  },
  // Notifications
  notifications: {
    slack: {
      enabled: {
        type: Boolean,
        default: false
      },
      webhookUrl: String,
      channel: String,
      events: [{
        type: String,
        enum: ['received', 'forwarded', 'failed']
      }]
    },
    discord: {
      enabled: {
        type: Boolean,
        default: false
      },
      webhookUrl: String,
      events: [{
        type: String,
        enum: ['received', 'forwarded', 'failed']
      }]
    },
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      recipients: [String],
      events: [{
        type: String,
        enum: ['received', 'forwarded', 'failed']
      }]
    }
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
