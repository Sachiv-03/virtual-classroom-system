const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, announcementController.createAnnouncement);
router.get('/', protect, announcementController.getAllAnnouncements);
router.get('/latest', protect, announcementController.getLatestAnnouncements);

module.exports = router;
