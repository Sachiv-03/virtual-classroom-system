const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');
const FocusSession = require('../models/FocusSession');
const Course = require('../models/Course');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

// @desc    Get teacher dashboard stats
// @route   GET /api/dashboard/teacher
// @access  Private/Teacher
exports.getTeacherDashboard = asyncHandler(async (req, res, next) => {
    const teacherId = req.user.id;

    const query = req.user.role === 'admin' ? {} : { teacherId };

    // Total assignments
    const totalAssignments = await Assignment.countDocuments(query);

    // Get all assignment IDs
    const assignments = await Assignment.find(query).select('_id');
    const assignmentIds = assignments.map(a => a._id);

    // Total submissions for these assignments
    const totalSubmissions = await Submission.countDocuments({
        assignmentId: { $in: assignmentIds }
    });

    // Submissions pending grading
    const pendingGrading = await Submission.countDocuments({
        assignmentId: { $in: assignmentIds },
        status: 'pending'
    });

    // Graded submissions
    const gradedSubmissions = await Submission.countDocuments({
        assignmentId: { $in: assignmentIds },
        status: 'graded'
    });

    const coursesData = await Course.find(query);
    const classesList = [];
    const daysWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = daysWeek[new Date().getDay()];
    
    coursesData.forEach(c => {
        if(c.schedule) {
            c.schedule.forEach(s => {
                // Show all scheduled classes (not just today)
                if(s.day && s.startTime && s.endTime) {
                    classesList.push({
                        id: c._id,
                        subject: c.title,
                        teacher: c.teacher || 'Instructor',
                        time: s.startTime || "09:00 AM",
                        duration: `${s.startTime || "09:00"} - ${s.endTime || "10:00"}`,
                        students: c.enrolledStudents || 0,
                        isLive: s.day === today,
                        meetLink: s.meetLink,
                        day: s.day,
                        color: s.day === today ? "blue" : "orange"
                    });
                }
            });
        }
    });

    // Total students in all courses taught by this teacher
    const studentsCount = await User.countDocuments({
        enrolledCourses: { $in: coursesData.map(c => c._id) },
        role: 'student'
    });

    const userObj = await User.findById(teacherId);

    // Fetch upcoming assignments for teacher
    const assignmentUpcomingQuery = {
        ...query,
        dueDate: { $gte: new Date() }
    };

    const upcomingAssignments = await Assignment.find(assignmentUpcomingQuery)
        .sort({ dueDate: 1 })
        .limit(5);

    res.status(200).json({
        success: true,
        data: {
            totalAssignments,
            totalSubmissions,
            pendingGrading,
            gradedSubmissions,
            totalCourses: coursesData.length,
            totalStudents: studentsCount,
            streak: userObj.streak || 0,
            loginHistory: userObj.loginHistory || [],
            classes: classesList
        }
    });
});

// @desc    Get student dashboard stats
// @route   GET /api/dashboard/student
// @access  Private/Student
exports.getStudentDashboard = asyncHandler(async (req, res, next) => {
    const studentId = req.user.id;

    const userObj = await User.findById(studentId).populate('enrolledCourses');
    if (!userObj) return next(new ErrorResponse('User not found', 404));

    // Get all enrolled course IDs
    const enrolledCourseIds = userObj.enrolledCourses.map(c => c._id.toString());

    // Total assignments available in enrolled courses
    const totalAssignments = await Assignment.countDocuments({
        courseId: { $in: enrolledCourseIds }
    });

    // Assignments submitted by this student
    const studentSubmissions = await Submission.find({ studentId });
    const submittedAssignmentsCount = studentSubmissions.length;

    // Pending assignments
    const pendingAssignmentsCount = totalAssignments - submittedAssignmentsCount;

    // Calculate average marks
    const gradedSubmissions = studentSubmissions.filter(s => s.status === 'graded');
    let totalMarks = 0;
    let gradedCount = 0;

    gradedSubmissions.forEach(sub => {
        if (sub.marks !== null) {
            totalMarks += sub.marks;
            gradedCount++;
        }
    });

    const avgMarks = gradedCount > 0 ? (totalMarks / gradedCount).toFixed(2) : 0;

    // Fetch actual focus sessions
    const focusSessions = await FocusSession.find({ user: studentId });
    const totalFocusMinutes = Math.floor(focusSessions.reduce((acc, curr) => acc + curr.duration, 0) / 60);



    const classesList = [];
    if (userObj.enrolledCourses && userObj.enrolledCourses.length > 0) {
        const daysWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = daysWeek[new Date().getDay()];
        
        userObj.enrolledCourses.forEach(c => {
            if(c.schedule && c.schedule.length > 0) {
                // Course has schedule - add each slot
                c.schedule.forEach(s => {
                    if(s.day && s.startTime && s.endTime) {
                        classesList.push({
                            id: c._id,
                            subject: c.title,
                            teacher: c.teacher || 'Instructor',
                            time: s.startTime || "09:00 AM",
                            duration: `${s.startTime || "09:00"} - ${s.endTime || "10:00"}`,
                            students: c.enrolledStudents || 0,
                            isLive: s.day === today,
                            meetLink: s.meetLink,
                            day: s.day,
                            color: s.day === today ? "blue" : "orange"
                        });
                    }
                });
            } else {
                // Course has no schedule yet - still show it so student knows they're enrolled
                classesList.push({
                    id: c._id,
                    subject: c.title,
                    teacher: c.teacher || 'Instructor',
                    time: 'TBD',
                    duration: 'Schedule not set',
                    students: c.enrolledStudents || 0,
                    isLive: false,
                    meetLink: null,
                    day: 'TBD',
                    color: 'purple'
                });
            }
        });
    }

    res.status(200).json({
        success: true,
        data: {
            totalAssignments,
            submittedAssignments: submittedAssignmentsCount,
            pendingAssignments: pendingAssignmentsCount,
            avgMarks: `${avgMarks}%`,
            enrolledCoursesCount: userObj.enrolledCourses?.length || 0,
            focusScore: totalFocusMinutes > 0 ? `${totalFocusMinutes} mins` : '0 mins',
            streak: userObj.streak || 0,
            loginHistory: userObj.loginHistory || [],
            classes: classesList
        }
    });
});

// @desc    Get leaderboard data
// @route   GET /api/dashboard/leaderboard
// @access  Private
exports.getLeaderboard = asyncHandler(async (req, res, next) => {
    const topUsers = await User.find({ role: 'student' })
        .sort({ xp: -1 })
        .limit(10)
        .select('name xp level profilePhoto');

    const formattedLeaderboard = topUsers.map((user, index) => ({
        rank: index + 1,
        name: user.name,
        avatar: user.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        initials: user.name.split(' ').map(n => n[0]).join(''),
        xp: user.xp,
        level: user.level,
        trend: "same", // Defaulting to same for now
        isCurrentUser: user._id.toString() === req.user.id
    }));

    res.status(200).json({
        success: true,
        data: formattedLeaderboard
    });
});
// @desc    Get all students
// @route   GET /api/dashboard/students
// @access  Private/Teacher
exports.getStudents = asyncHandler(async (req, res, next) => {
    const students = await User.find({ role: 'student' }).select('name email department rollNumber level xp');
    res.status(200).json({
        success: true,
        count: students.length,
        data: students
    });
});
