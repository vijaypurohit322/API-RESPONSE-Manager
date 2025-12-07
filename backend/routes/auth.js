const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

// Strict rate limiting for auth endpoints
router.post('/register', rateLimiter.strict({ max: 5, windowMs: 15 * 60 * 1000 }), authController.register);
router.post('/login', rateLimiter.strict({ max: 10, windowMs: 15 * 60 * 1000 }), authController.login);

// Email verification routes
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', rateLimiter.strict({ max: 3, windowMs: 15 * 60 * 1000 }), authController.resendVerification);

// Protected routes
router.put('/update-profile', auth, authController.updateProfile);
router.post('/change-password', auth, authController.changePassword);
router.get('/sessions', auth, authController.getSessions);
router.delete('/sessions/:sessionId', auth, authController.revokeSession);
router.post('/sessions/revoke-all', auth, authController.revokeAllSessions);

module.exports = router;
