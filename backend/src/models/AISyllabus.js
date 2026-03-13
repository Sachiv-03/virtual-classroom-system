const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    thumbnail: { type: String }
}, { _id: false });

const materialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    source: { type: String }
}, { _id: false });

const topicSchema = new mongoose.Schema({
    topicTitle: { type: String, required: true },
    videos: [videoSchema],
    materials: [materialSchema],
    notes: { type: String },
    isCompleted: { type: Boolean, default: false }
}, { _id: false });

const unitSchema = new mongoose.Schema({
    unitTitle: { type: String, required: true },
    topics: [topicSchema]
}, { _id: false });

const AISyllabusSchema = new mongoose.Schema({
    courseName: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: String, required: true },
    units: [unitSchema],
    generatedResources: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'pending'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AISyllabus', AISyllabusSchema);
