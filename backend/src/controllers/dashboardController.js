const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');

// @desc    Get teacher dashboard stats
// @route   GET /api/dashboard/teacher
// @access  Private/Teacher
exports.getTeacherDashboard = async (req, res) => {
    try {
        const teacherId = req.user.id;

        // Total assignments created by this teacher
        const totalAssignments = await Assignment.countDocuments({ teacherId });

        // Get all assignment IDs for this teacher
        const assignments = await Assignment.find({ teacherId }).select('_id');
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

        res.status(200).json({
            success: true,
            data: {
                totalAssignments,
                totalSubmissions,
                pendingGrading,
                gradedSubmissions,
                totalCourses: 5, // Mock value as course model is not fully implemented
                totalStudents: 156 // Mock value
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get student dashboard stats
// @route   GET /api/dashboard/student
// @access  Private/Student
exports.getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Total assignments available
        const totalAssignments = await Assignment.countDocuments();

        // Assignments submitted by this student
        const submittedAssignments = await Submission.countDocuments({ studentId });

        // Pending assignments
        const pendingAssignments = totalAssignments - submittedAssignments;

        // Calculate average marks
        const gradedSubmissions = await Submission.find({ studentId, status: 'graded' });
        let totalMarks = 0;
        let gradedCount = 0;

        gradedSubmissions.forEach(sub => {
            if (sub.marks !== null) {
                totalMarks += sub.marks;
                gradedCount++;
            }
        });

        const avgMarks = gradedCount > 0 ? (totalMarks / gradedCount).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            data: {
                totalAssignments,
                submittedAssignments,
                pendingAssignments,
                avgMarks: `${avgMarks}%`,
                enrolledCourses: 8, // Mock value
                focusScore: '92%' // Mock value
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
