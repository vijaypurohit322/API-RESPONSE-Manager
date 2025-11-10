const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, responseController.createResponse);
router.get('/:projectId', authMiddleware, responseController.getResponses);

module.exports = router;
