const express = require('express');
const { logFocusSession } = require('../controllers/focusController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, logFocusSession);

module.exports = router;
