const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const path = require('path');
const fs = require('fs');

// @desc    Submit an assignment
// @route   POST /api/submissions
// @access  Private/Student
exports.submitAssignment = async (req, res) => {
    try {
        const { assignmentId, rollNumber } = req.body;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        const isLate = new Date() > new Date(assignment.dueDate);

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        if (!rollNumber) {
            return res.status(400).json({ success: false, message: 'Roll number is required' });
        }

        // Check if already submitted (if so, we update it)
        let submission = await Submission.findOne({
            assignmentId,
            studentId: req.user.id
        });

        if (submission) {
            // Delete old file if it exists
            const oldPath = path.join(__dirname, '../../', submission.filePath);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }

            // Update existing submission
            submission.filePath = req.file.path;
            submission.fileName = req.file.originalname;
            submission.rollNumber = rollNumber;
            submission.submittedAt = Date.now();
            submission.status = 'pending';
            submission.isLate = isLate;
            await submission.save();
        } else {
            // Create new submission
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
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get submissions for an assignment
// @route   GET /api/submissions/assignment/:assignmentId
// @access  Private
exports.getSubmissions = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Grade a submission
// @route   PUT /api/submissions/:id/grade
// @access  Private/Teacher
exports.gradeSubmission = async (req, res) => {
    try {
        const { marks, feedback } = req.body;

        let submission = await Submission.findById(req.params.id).populate('assignmentId');

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Check if user is the teacher who created the assignment
        if (submission.assignmentId.teacherId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to grade this submission'
            });
        }

        submission.marks = marks;
        submission.feedback = feedback;
        submission.status = 'graded';

        await submission.save();

        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Download submission file
// @route   GET /api/submissions/:id/download
// @access  Private
exports.downloadSubmission = async (req, res) => {
    try {
        // Find submission but DON'T populate to avoid potential object serialization issues with res.download
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        // Fetch assignment separately for authorization
        const assignment = await Assignment.findById(submission.assignmentId);

        if (req.user.role === 'student' && submission.studentId.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        if (req.user.role === 'teacher' && assignment.teacherId.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // Construct absolute path
        const filePath = path.resolve(__dirname, '../../', submission.filePath);

        console.log('Attempting to download file:', filePath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found on server' });
        }

        // Use a callback to catch internal errors in res.download
        res.download(filePath, submission.fileName, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).send({
                        success: false,
                        message: "Could not download the file. " + err
                    });
                }
            }
        });
    } catch (error) {
        console.error('Download catch error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};
