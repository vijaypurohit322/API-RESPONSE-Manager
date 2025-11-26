const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tunnelController = require('../controllers/tunnelController');

// @route   POST /api/tunnels
// @desc    Create a new tunnel
// @access  Private
router.post('/', auth, tunnelController.createTunnel);

// @route   GET /api/tunnels
// @desc    Get all tunnels for authenticated user
// @access  Private
router.get('/', auth, tunnelController.getTunnels);

// @route   GET /api/tunnels/:id
// @desc    Get tunnel by ID
// @access  Private
router.get('/:id', auth, tunnelController.getTunnelById);

// @route   PUT /api/tunnels/:id/status
// @desc    Update tunnel status
// @access  Private
router.put('/:id/status', auth, tunnelController.updateTunnelStatus);

// @route   DELETE /api/tunnels/:id
// @desc    Delete/stop a tunnel
// @access  Private
router.delete('/:id', auth, tunnelController.deleteTunnel);

// @route   POST /api/tunnels/:id/heartbeat
// @desc    Send heartbeat to keep tunnel alive
// @access  Private
router.post('/:id/heartbeat', auth, tunnelController.heartbeat);

// @route   GET /api/tunnels/:id/stats
// @desc    Get tunnel statistics
// @access  Private
router.get('/:id/stats', auth, tunnelController.getTunnelStats);

// @route   GET /api/tunnels/check/:subdomain
// @desc    Check if subdomain is available
// @access  Private
router.get('/check/:subdomain', auth, tunnelController.checkSubdomain);

// @route   POST /api/tunnels/:id/stats/increment
// @desc    Increment tunnel request count and bytes
// @access  Private
router.post('/:id/stats/increment', auth, tunnelController.incrementStats);

// @route   PUT /api/tunnels/:id/ip-whitelist
// @desc    Update tunnel IP whitelist
// @access  Private
router.put('/:id/ip-whitelist', auth, tunnelController.updateIPWhitelist);

// @route   PUT /api/tunnels/:id/ip-blacklist
// @desc    Update tunnel IP blacklist
// @access  Private
router.put('/:id/ip-blacklist', auth, tunnelController.updateIPBlacklist);

// @route   POST /api/tunnels/:id/custom-domain
// @desc    Set custom domain for tunnel
// @access  Private
router.post('/:id/custom-domain', auth, tunnelController.setCustomDomain);

// @route   POST /api/tunnels/:id/ssl
// @desc    Upload custom SSL certificate
// @access  Private
router.post('/:id/ssl', auth, tunnelController.uploadSSLCertificate);

// @route   POST /api/tunnels/:id/auth/oauth
// @desc    Configure OAuth authentication
// @access  Private
router.post('/:id/auth/oauth', auth, tunnelController.configureOAuth);

// @route   POST /api/tunnels/:id/auth/oidc
// @desc    Configure OIDC authentication
// @access  Private
router.post('/:id/auth/oidc', auth, tunnelController.configureOIDC);

// @route   POST /api/tunnels/:id/auth/saml
// @desc    Configure SAML authentication
// @access  Private
router.post('/:id/auth/saml', auth, tunnelController.configureSAML);

// @route   POST /api/tunnels/:id/ingress
// @desc    Configure ingress rules
// @access  Private
router.post('/:id/ingress', auth, tunnelController.configureIngress);

// @route   GET /api/tunnels/:id/auth/oauth/url
// @desc    Get OAuth authorization URL
// @access  Public
router.get('/:id/auth/oauth/url', tunnelController.getOAuthUrl);

// @route   GET /api/tunnels/:id/auth/oidc/url
// @desc    Get OIDC authorization URL
// @access  Public
router.get('/:id/auth/oidc/url', tunnelController.getOIDCUrl);

// @route   GET /api/tunnels/:id/auth/saml/url
// @desc    Get SAML login URL
// @access  Public
router.get('/:id/auth/saml/url', tunnelController.getSAMLUrl);

module.exports = router;
