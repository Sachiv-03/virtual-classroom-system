const express = require('express');
const {
    submitAssignment,
    getSubmissions,
    gradeSubmission,
    downloadSubmission
} = require('../controllers/submissionController');

const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('student'), upload.single('file'), submitAssignment);
router.get('/assignment/:assignmentId', getSubmissions);
router.put('/:id/grade', authorize('teacher'), gradeSubmission);
router.get('/:id/download', downloadSubmission);

module.exports = router;
