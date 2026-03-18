const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

const { protect, authorize } = require('../middleware/authMiddleware');
const advancedResults = require('../middleware/advancedResults');
const Course = require('../models/Course');
const { validateCourse, validateCourseUpdate, validateSchedule } = require('../middleware/validationMiddleware');

router.get('/', protect, (req, res, next) => {
    if (req.user.role === 'teacher') {
        req.query.teacherId = req.user.id;
    }
    next();
}, advancedResults(Course), courseController.getAllCourses);
router.get('/:id', protect, courseController.getCourseById);
router.get('/:id/enrollment-status', protect, courseController.checkEnrollmentStatus);
router.post('/', protect, authorize('teacher'), validateCourse, courseController.createCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), validateCourseUpdate, courseController.updateCourse);
router.put('/:id/attach-syllabus', protect, authorize('admin', 'teacher'), courseController.attachSyllabus);
router.delete('/:id', protect, authorize('teacher', 'admin'), courseController.deleteCourse);
router.post('/:id/schedule', protect, authorize('teacher', 'admin'), validateSchedule, courseController.addSchedule);

// Syllabus Builder Routes
router.post('/:id/units', protect, authorize('admin', 'teacher'), courseController.addUnit);
router.put('/:id/units/:unitId', protect, authorize('admin', 'teacher'), courseController.updateUnit);
router.delete('/:id/units/:unitId', protect, authorize('admin', 'teacher'), courseController.deleteUnit);
router.post('/:id/units/:unitId/topics', protect, authorize('admin', 'teacher'), courseController.addTopic);
router.delete('/:id/units/:unitId/topics/:topicId', protect, authorize('admin', 'teacher'), courseController.deleteTopic);

// Self-enrollment route for students (free courses)
router.post('/:id/enroll', protect, courseController.enrollInCourse);

module.exports = router;
