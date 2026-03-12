const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

const { protect, authorize } = require('../middleware/authMiddleware');
const advancedResults = require('../middleware/advancedResults');
const Course = require('../models/Course');

router.get('/', protect, advancedResults(Course), courseController.getAllCourses);
router.get('/:id', protect, courseController.getCourseById);
router.get('/:id/enrollment-status', protect, courseController.checkEnrollmentStatus);
router.post('/', protect, authorize('teacher'), courseController.createCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), courseController.updateCourse);
router.put('/:id/attach-syllabus', protect, authorize('admin', 'teacher'), courseController.attachSyllabus);
router.delete('/:id', protect, authorize('teacher', 'admin'), courseController.deleteCourse);
router.post('/:id/schedule', protect, authorize('teacher'), courseController.addSchedule);

// Syllabus Builder Routes
router.post('/:id/units', protect, authorize('admin', 'teacher'), courseController.addUnit);
router.put('/:id/units/:unitId', protect, authorize('admin', 'teacher'), courseController.updateUnit);
router.delete('/:id/units/:unitId', protect, authorize('admin', 'teacher'), courseController.deleteUnit);
router.post('/:id/units/:unitId/topics', protect, authorize('admin', 'teacher'), courseController.addTopic);
module.exports = router;
