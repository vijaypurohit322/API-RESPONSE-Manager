const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, commentController.createComment);
router.get('/:responseId', authMiddleware, commentController.getComments);

module.exports = router;
