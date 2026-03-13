const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['pdf', 'video', 'article'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    }
});

const chapterSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    resources: [resourceSchema]
});

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    chapters: [chapterSchema]
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
