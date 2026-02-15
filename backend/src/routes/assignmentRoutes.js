const express = require('express');
const {
    createAssignment,
    getAssignments,
    getAssignment,
    updateAssignment,
    deleteAssignment,
    downloadAssignmentAttachment
} = require('../controllers/assignmentController');

const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getAssignments)
    .post(authorize('teacher'), upload.array('attachments', 5), createAssignment);

router.get('/:id/download/:fileIndex', downloadAssignmentAttachment);

router
    .route('/:id')
    .get(getAssignment)
    .put(authorize('teacher'), updateAssignment)
    .delete(authorize('teacher'), deleteAssignment);

module.exports = router;
