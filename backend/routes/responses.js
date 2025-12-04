const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/responses
// @desc    Create a new API response (from proxy server - uses API key)
// @access  Semi-public (requires valid project ID)
router.post('/', responseController.createResponse);

// @route   GET /api/responses/:projectId
// @desc    Get responses for a project
// @access  Private (requires auth) OR Public (if accessed via share token)
router.get('/:projectId', responseController.getResponses);

// @route   DELETE /api/responses/:id
// @desc    Delete a specific response
// @access  Private
router.delete('/:id', authMiddleware, responseController.deleteResponse);

module.exports = router;
