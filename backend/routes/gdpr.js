/**
 * GDPR Compliance Routes
 * 
 * Implements:
 * - Article 15: Right of access (data export)
 * - Article 17: Right to erasure (account deletion)
 * - Article 20: Right to data portability (data export in machine-readable format)
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const gdprController = require('../controllers/gdprController');
const rateLimiter = require('../middleware/rateLimiter');

// Apply strict rate limiting to GDPR endpoints
const gdprLimiter = rateLimiter.strict({ max: 5, windowMs: 60 * 60 * 1000 }); // 5 requests per hour

// @route   GET /api/gdpr/export
// @desc    Export all user data (GDPR Article 15 & 20)
// @access  Private
router.get('/export', auth, gdprLimiter, gdprController.exportUserData);

// @route   DELETE /api/gdpr/delete-account
// @desc    Delete user account and all associated data (GDPR Article 17)
// @access  Private
router.delete('/delete-account', auth, gdprLimiter, gdprController.deleteAccount);

// @route   GET /api/gdpr/data-categories
// @desc    Get list of data categories stored (GDPR Article 15)
// @access  Private
router.get('/data-categories', auth, gdprController.getDataCategories);

module.exports = router;
