const express = require('express');
const { getTeacherDashboard, getStudentDashboard, getLeaderboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/teacher', authorize('teacher', 'admin'), getTeacherDashboard);
router.get('/student', authorize('student', 'admin'), getStudentDashboard);
router.get('/leaderboard', getLeaderboard);
router.get('/students', authorize('teacher', 'admin'), require('../controllers/dashboardController').getStudents);

module.exports = router;
