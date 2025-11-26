const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');

// Strict rate limiting for auth endpoints
router.post('/register', rateLimiter.strict({ max: 5, windowMs: 15 * 60 * 1000 }), authController.register);
router.post('/login', rateLimiter.strict({ max: 10, windowMs: 15 * 60 * 1000 }), authController.login);

module.exports = router;
