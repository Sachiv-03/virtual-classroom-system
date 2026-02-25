const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Submit an assignment
// @route   POST /api/submissions
// @access  Private/Student
exports.submitAssignment = asyncHandler(async (req, res, next) => {
    const { assignmentId, rollNumber } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
        return next(new ErrorResponse('Assignment not found', 404));
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    if (!rollNumber) {
        return next(new ErrorResponse('Roll number is required', 400));
    }

    // Check if already submitted
    let submission = await Submission.findOne({
        assignmentId,
        studentId: req.user.id
    });

    if (submission) {
        // Delete old file
        const oldPath = path.join(__dirname, '../../', submission.filePath);
        if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
        }

        // Update
        submission.filePath = req.file.path;
        submission.fileName = req.file.originalname;
        submission.rollNumber = rollNumber;
        submission.submittedAt = Date.now();
        submission.status = 'pending';
        submission.isLate = isLate;
        await submission.save();
    } else {
        // Create
        submission = await Submission.create({
            assignmentId,
            studentId: req.user.id,
            rollNumber,
            filePath: req.file.path,
            fileName: req.file.originalname,
            isLate: isLate
        });
    }

    res.status(201).json({
        success: true,
        data: submission
    });
});

// @desc    Get submissions for an assignment
// @route   GET /api/submissions/assignment/:assignmentId
// @access  Private
exports.getSubmissions = asyncHandler(async (req, res, next) => {
    let query;

    if (req.user.role === 'teacher') {
        query = Submission.find({ assignmentId: req.params.assignmentId })
            .populate('studentId', 'name email');
    } else {
        query = Submission.find({
            assignmentId: req.params.assignmentId,
            studentId: req.user.id
        });
    }

    const submissions = await query.sort('-submittedAt');

    res.status(200).json({
        success: true,
        count: submissions.length,
        data: submissions
    });
});

// @desc    Grade a submission
// @route   PUT /api/submissions/:id/grade
// @access  Private/Teacher
exports.gradeSubmission = asyncHandler(async (req, res, next) => {
    const { marks, feedback } = req.body;

    let submission = await Submission.findById(req.params.id).populate('assignmentId');

    if (!submission) {
        return next(new ErrorResponse('Submission not found', 404));
    }

    // Check if user is the teacher
    if (submission.assignmentId.teacherId.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to grade this submission', 401));
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.status = 'graded';

    await submission.save();

    res.status(200).json({
        success: true,
        data: submission
    });
});

// @desc    Download submission file
// @route   GET /api/submissions/:id/download
// @access  Private
exports.downloadSubmission = asyncHandler(async (req, res, next) => {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
        return next(new ErrorResponse('Submission not found', 404));
    }

    const assignment = await Assignment.findById(submission.assignmentId);

    if (req.user.role === 'student' && submission.studentId.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized', 401));
    }
    if (req.user.role === 'teacher' && assignment.teacherId.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized', 401));
    }

    const filePath = path.resolve(__dirname, '../../', submission.filePath);

    if (!fs.existsSync(filePath)) {
        return next(new ErrorResponse('File not found on server', 404));
    }

    res.download(filePath, submission.fileName);
});
