const Conf = require('conf');
const path = require('path');

const config = new Conf({
  projectName: 'arm-cli',
  defaults: {
    apiUrl: 'http://localhost:5000/api',
    token: null,
    userId: null,
    email: null,
    defaultTunnelPort: 3000,
    defaultWebhookExpiry: 86400 // 24 hours
  },
  schema: {
    apiUrl: {
      type: 'string',
      format: 'uri'
    },
    token: {
      type: ['string', 'null']
    },
    userId: {
      type: ['string', 'null']
    },
    email: {
      type: ['string', 'null']
    },
    defaultTunnelPort: {
      type: 'number',
      minimum: 1,
      maximum: 65535
    },
    defaultWebhookExpiry: {
      type: 'number',
      minimum: 3600
    }
  }
});

module.exports = config;
