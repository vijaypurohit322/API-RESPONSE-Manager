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

module.exports = router;
