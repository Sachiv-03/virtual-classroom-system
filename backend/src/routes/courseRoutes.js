const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

const { protect, authorize } = require('../middleware/authMiddleware');
const advancedResults = require('../middleware/advancedResults');
const Course = require('../models/Course');

router.get('/', advancedResults(Course), courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.post('/', protect, authorize('teacher'), courseController.createCourse);
router.put('/:id', protect, authorize('teacher'), courseController.updateCourse);
router.delete('/:id', protect, authorize('teacher'), courseController.deleteCourse);
router.post('/:id/schedule', protect, authorize('teacher'), courseController.addSchedule);

module.exports = router;
