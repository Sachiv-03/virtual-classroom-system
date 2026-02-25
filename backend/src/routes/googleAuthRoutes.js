const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/googleAuthController');
const { protect } = require('../middleware/authMiddleware');

router.get('/url', protect, googleAuthController.getAuthUrl);
router.get('/callback', protect, googleAuthController.handleCallback);

module.exports = router;
