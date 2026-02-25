const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private/Teacher
exports.createAssignment = asyncHandler(async (req, res, next) => {
    req.body.teacherId = req.user.id;

    const assignment = await Assignment.create(req.body);

    res.status(201).json({
        success: true,
        data: assignment
    });
});

// @desc    Get all assignments with user submission status
// @route   GET /api/assignments
// @access  Private
exports.getAssignments = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'teacher') {
        const assignments = await Assignment.find({ teacherId: req.user.id }).sort('-createdAt');
        return res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
        });
    }

    // For Students: We want to see the assignment AND their submission status/marks
    const assignments = await Assignment.aggregate([
        {
            $lookup: {
                from: 'submissions',
                let: { assignmentId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$assignmentId', '$$assignmentId'] },
                                    { $eq: ['$studentId', new mongoose.Types.ObjectId(req.user.id)] }
                                ]
                            }
                        }
                    }
                ],
                as: 'userSubmission'
            }
        },
        {
            $addFields: {
                submission: { $arrayElemAt: ['$userSubmission', 0] }
            }
        },
        {
            $project: {
                userSubmission: 0
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments
    });
});

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignment = asyncHandler(async (req, res, next) => {
    const assignment = await Assignment.findById(req.params.id).populate('teacherId', 'name email');

    if (!assignment) {
        return next(new ErrorResponse(`Assignment not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: assignment
    });
});

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private/Teacher
exports.updateAssignment = asyncHandler(async (req, res, next) => {
    let assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
        return next(new ErrorResponse(`Assignment not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is assignment teacher
    if (assignment.teacherId.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this assignment`, 401));
    }

    assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: assignment
    });
});

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Teacher
exports.deleteAssignment = asyncHandler(async (req, res, next) => {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
        return next(new ErrorResponse(`Assignment not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is assignment teacher
    if (assignment.teacherId.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this assignment`, 401));
    }

    // 1. Delete assignment attachments from disk
    if (assignment.attachments && assignment.attachments.length > 0) {
        assignment.attachments.forEach(file => {
            const filePath = path.join(__dirname, '../../', file.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
    }

    // 2. Delete all submissions and their files
    const submissions = await Submission.find({ assignmentId: assignment._id });
    submissions.forEach(sub => {
        const subPath = path.join(__dirname, '../../', sub.filePath);
        if (fs.existsSync(subPath)) {
            fs.unlinkSync(subPath);
        }
    });
    await Submission.deleteMany({ assignmentId: assignment._id });

    // 3. Delete the assignment itself
    await assignment.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Download assignment attachment
// @route   GET /api/assignments/:id/download/:fileIndex
// @access  Private
exports.downloadAssignmentAttachment = asyncHandler(async (req, res, next) => {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
        return next(new ErrorResponse(`Assignment not found with id of ${req.params.id}`, 404));
    }

    const fileIndex = parseInt(req.params.fileIndex);
    if (isNaN(fileIndex) || !assignment.attachments[fileIndex]) {
        return next(new ErrorResponse(`File not found at index ${req.params.fileIndex}`, 404));
    }

    const file = assignment.attachments[fileIndex];
    const filePath = path.join(__dirname, '../../', file.path);

    if (!fs.existsSync(filePath)) {
        return next(new ErrorResponse('File not found on server', 404));
    }

    res.download(filePath, file.name);
});
