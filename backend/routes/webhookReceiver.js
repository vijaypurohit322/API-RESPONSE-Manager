const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Middleware to capture raw body for signature validation
const rawBodyMiddleware = express.json({
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
});

// @route   ALL /webhook/:webhookId
// @desc    Receive incoming webhook (public endpoint)
// @access  Public
router.all('/:webhookId', rawBodyMiddleware, webhookController.receiveWebhook);

module.exports = router;
