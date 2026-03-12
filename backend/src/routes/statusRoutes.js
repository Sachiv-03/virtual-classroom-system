const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createStatus, getStatuses, viewStatus, deleteStatus } = require('../controllers/statusController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for status uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/statuses/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, `status-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(protect);

router.route('/')
    .get(getStatuses)
    .post(upload.single('statusFile'), createStatus);

router.route('/:id')
    .delete(deleteStatus);

router.post('/:id/view', viewStatus);

module.exports = router;
