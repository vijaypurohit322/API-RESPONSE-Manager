const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');
const authMiddleware = require('../middleware/auth');

router.post('/', responseController.createResponse);
router.get('/:projectId', responseController.getResponses);

module.exports = router;
