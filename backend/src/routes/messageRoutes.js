const express = require('express');
const { getChatUsers, getConversation, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes are protected

router.get('/users', getChatUsers);
router.get('/:userId', getConversation);
router.post('/send', sendMessage);

module.exports = router;
