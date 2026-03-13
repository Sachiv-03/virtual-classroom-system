const express = require('express');
const router = express.Router();
const aiSyllabusController = require('../controllers/aiSyllabusController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public view - with role conditional check inside controller for approved only
router.get('/', protect, aiSyllabusController.getSyllabuses);
router.get('/:id', protect, aiSyllabusController.getSyllabus);

// Admin Only
router.post('/create', protect, authorize('admin', 'teacher'), aiSyllabusController.createSyllabus);
router.post('/generate-resources/:id', protect, authorize('admin'), aiSyllabusController.generateResources);
router.put('/approve/:id', protect, authorize('admin'), aiSyllabusController.approveSyllabus);
router.put('/update/:id', protect, authorize('admin'), aiSyllabusController.updateSyllabus);
router.delete('/delete/:id', protect, authorize('admin'), aiSyllabusController.deleteSyllabus);

module.exports = router;
