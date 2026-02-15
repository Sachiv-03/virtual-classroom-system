const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Assignment',
        required: true
    },
    studentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    rollNumber: {
        type: String,
        required: [true, 'Please add your roll number']
    },
    filePath: {
        type: String,
        required: [true, 'Please add a file path']
    },
    fileName: {
        type: String
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    marks: {
        type: Number,
        default: null
    },
    feedback: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'graded'],
        default: 'pending'
    },
    isLate: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Submission', submissionSchema);
