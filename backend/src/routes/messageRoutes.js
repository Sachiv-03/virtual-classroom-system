const express = require('express');
const { getConversations, getMessages, sendMessage, searchUsers } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes are protected

router.get('/conversations', getConversations);
router.get('/users/search', searchUsers);
router.get('/:userId', getMessages);
router.post('/', sendMessage);

module.exports = router;
