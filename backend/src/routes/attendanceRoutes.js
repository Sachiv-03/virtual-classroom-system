const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have auth middleware

const { validateAttendance, validateCourseIdParam } = require('../middleware/validationMiddleware');
const attendanceLimiter = require('../middleware/attendanceLimiter');

router.post('/mark', protect, attendanceLimiter, validateAttendance, attendanceController.markAttendance);
router.get('/analytics/:courseId', protect, validateCourseIdParam, attendanceController.getAnalytics);
router.get('/report/:courseId', protect, validateCourseIdParam, attendanceController.generateReport);

module.exports = router;
