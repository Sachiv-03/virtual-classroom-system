const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// Define routes
router.post('/upload', protect, authorize('admin'), upload.single('file'), syllabusController.uploadSyllabus);
router.get('/', syllabusController.getAllSyllabi);
router.get('/:id', syllabusController.getSyllabusById);
router.get('/semester/:semester', syllabusController.getSyllabusBySemester);
router.put('/:id', protect, authorize('admin'), syllabusController.updateSyllabus);
router.delete('/:id', protect, authorize('admin'), syllabusController.deleteSyllabus);

module.exports = router;
