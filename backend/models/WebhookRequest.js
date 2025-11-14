const mongoose = require('mongoose');

const webhookRequestSchema = new mongoose.Schema({
  webhookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Webhook',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Request details
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
  },
  url: {
    type: String,
    required: true
  },
  headers: {
    type: Map,
    of: String
  },
  body: {
    type: mongoose.Schema.Types.Mixed
  },
  rawBody: {
    type: String
  },
  query: {
    type: Map,
    of: String
  },
  // Client information
  clientIp: {
    type: String,
    index: true
  },
  userAgent: {
    type: String
  },
  // Response details (if forwarded)
  forwarding: {
    attempted: {
      type: Boolean,
      default: false
    },
    success: {
      type: Boolean,
      default: false
    },
    targetUrl: {
      type: String
    },
    statusCode: {
      type: Number
    },
    responseHeaders: {
      type: Map,
      of: String
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed
    },
    error: {
      type: String
    },
    duration: {
      type: Number // milliseconds
    },
    // Multiple destination results
    destinations: [{
      name: String,
      targetUrl: String,
      success: Boolean,
      statusCode: Number,
      error: String,
      duration: Number
    }]
  },
  // Signature validation
  signature: {
    provided: {
      type: String
    },
    valid: {
      type: Boolean
    },
    algorithm: {
      type: String
    }
  },
  // Processing status
  status: {
    type: String,
    enum: ['received', 'forwarded', 'failed', 'replayed'],
    default: 'received',
    index: true
  },
  // Replay information
  replay: {
    isReplay: {
      type: Boolean,
      default: false
    },
    originalRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebhookRequest'
    },
    replayCount: {
      type: Number,
      default: 0
    }
  },
  // Tags for filtering
  tags: [{
    type: String,
    index: true
  }],
  // Notes
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
webhookRequestSchema.index({ webhookId: 1, createdAt: -1 });
webhookRequestSchema.index({ userId: 1, createdAt: -1 });
webhookRequestSchema.index({ status: 1, createdAt: -1 });

// TTL index for automatic cleanup based on webhook retention settings
webhookRequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days default

// Virtual for request size
webhookRequestSchema.virtual('requestSize').get(function() {
  return JSON.stringify(this.body || this.rawBody || '').length;
});

// Method to mark as forwarded
webhookRequestSchema.methods.markForwarded = function(statusCode, responseHeaders, responseBody, duration) {
  this.forwarding.attempted = true;
  this.forwarding.success = true;
  this.forwarding.statusCode = statusCode;
  this.forwarding.responseHeaders = responseHeaders;
  this.forwarding.responseBody = responseBody;
  this.forwarding.duration = duration;
  this.status = 'forwarded';
  return this.save();
};

// Method to mark as failed
webhookRequestSchema.methods.markFailed = function(error, duration) {
  this.forwarding.attempted = true;
  this.forwarding.success = false;
  this.forwarding.error = error;
  this.forwarding.duration = duration;
  this.status = 'failed';
  return this.save();
};

// Method to create replay
webhookRequestSchema.methods.createReplay = async function() {
  const WebhookRequest = this.constructor;
  
  const replayData = {
    webhookId: this.webhookId,
    userId: this.userId,
    method: this.method,
    url: this.url,
    headers: this.headers,
    body: this.body,
    rawBody: this.rawBody,
    query: this.query,
    replay: {
      isReplay: true,
      originalRequestId: this._id,
      replayCount: (this.replay?.replayCount || 0) + 1
    },
    status: 'replayed'
  };

  return await WebhookRequest.create(replayData);
};

// Static method to get recent requests
webhookRequestSchema.statics.getRecentRequests = function(webhookId, limit = 50) {
  return this.find({ webhookId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get requests by status
webhookRequestSchema.statics.getRequestsByStatus = function(webhookId, status, limit = 50) {
  return this.find({ webhookId, status })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('WebhookRequest', webhookRequestSchema);
