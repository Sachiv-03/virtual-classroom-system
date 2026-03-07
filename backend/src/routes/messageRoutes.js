const express = require('express');
const multer = require('multer');
const { getChatUsers, getConversation, sendMessage, deleteMessage, reactToMessage, editMessage, toggleStarMessage, togglePinUser } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/messages');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});
const upload = multer({ storage });

router.use(protect); // All routes are protected

router.get('/users', getChatUsers);
router.get('/:userId', getConversation);
router.post('/send', upload.single('file'), sendMessage);
router.delete('/:id', deleteMessage);
router.put('/:id', editMessage);
router.post('/:id/react', reactToMessage);
router.post('/:id/star', toggleStarMessage);
router.post('/pin/:userId', togglePinUser);

module.exports = router;
