const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private/Teacher
exports.createAssignment = async (req, res) => {
    try {
        req.body.teacherId = req.user.id;

        // USER REQUEST: removed add file functionality for teacher
        /* 
        if (req.files) {
            req.body.attachments = req.files.map(file => ({
                name: file.originalname,
                path: file.path
            }));
        }
        */

        const assignment = await Assignment.create(req.body);

        res.status(201).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all assignments with user submission status
// @route   GET /api/assignments
// @access  Private
exports.getAssignments = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id).populate('teacherId', 'name email');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private/Teacher
exports.updateAssignment = async (req, res) => {
    try {
        let assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Make sure user is assignment teacher
        if (assignment.teacherId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'User not authorized to update this assignment'
            });
        }

        assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Teacher
exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Make sure user is assignment teacher
        if (assignment.teacherId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'User not authorized to delete this assignment'
            });
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
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Download assignment attachment
// @route   GET /api/assignments/:id/download/:fileIndex
// @access  Private
exports.downloadAssignmentAttachment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        const fileIndex = parseInt(req.params.fileIndex);
        if (isNaN(fileIndex) || !assignment.attachments[fileIndex]) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const file = assignment.attachments[fileIndex];
        const filePath = path.join(__dirname, '../../', file.path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found on server' });
        }

        res.download(filePath, file.name);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
