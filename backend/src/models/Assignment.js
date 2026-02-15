const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    subject: {
        type: String,
        required: [true, 'Please add a subject']
    },
    courseId: {
        type: String,
        required: [true, 'Please add a course ID']
    },
    teacherId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    dueDate: {
        type: Date,
        required: [true, 'Please add a due date']
    },
    maxMarks: {
        type: Number,
        required: [true, 'Please add maximum marks']
    },
    attachments: [{
        name: String,
        path: String
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);
