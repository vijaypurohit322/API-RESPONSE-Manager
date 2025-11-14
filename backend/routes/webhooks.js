const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const webhookController = require('../controllers/webhookController');

// @route   POST /api/webhooks
// @desc    Create a new webhook
// @access  Private
router.post('/', auth, webhookController.createWebhook);

// @route   GET /api/webhooks
// @desc    Get all webhooks for user
// @access  Private
router.get('/', auth, webhookController.getWebhooks);

// @route   GET /api/webhooks/:id
// @desc    Get webhook by ID
// @access  Private
router.get('/:id', auth, webhookController.getWebhookById);

// @route   PUT /api/webhooks/:id
// @desc    Update webhook
// @access  Private
router.put('/:id', auth, webhookController.updateWebhook);

// @route   DELETE /api/webhooks/:id
// @desc    Delete webhook
// @access  Private
router.delete('/:id', auth, webhookController.deleteWebhook);

// @route   GET /api/webhooks/:id/stats
// @desc    Get webhook statistics
// @access  Private
router.get('/:id/stats', auth, webhookController.getWebhookStats);

// @route   GET /api/webhooks/:id/requests
// @desc    Get webhook request history
// @access  Private
router.get('/:id/requests', auth, webhookController.getWebhookRequests);

// @route   GET /api/webhooks/:id/requests/:requestId
// @desc    Get single webhook request
// @access  Private
router.get('/:id/requests/:requestId', auth, webhookController.getWebhookRequest);

// @route   POST /api/webhooks/:id/requests/:requestId/replay
// @desc    Replay webhook request
// @access  Private
router.post('/:id/requests/:requestId/replay', auth, webhookController.replayWebhookRequest);

// @route   POST /api/webhooks/:id/requests/:requestId/resend
// @desc    Resend webhook request with modifications
// @access  Private
router.post('/:id/requests/:requestId/resend', auth, webhookController.resendWebhookRequest);

module.exports = router;
