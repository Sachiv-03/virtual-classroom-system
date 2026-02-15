const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
    unitTitle: { type: String, required: true },
    topics: [{ type: String }]
}, { _id: false });

const syllabusSchema = new mongoose.Schema({
    courseTitle: { type: String, required: true },
    courseCode: { type: String, required: true },
    semester: { type: String, required: true },
    academicYear: { type: String, required: true },
    description: { type: String },
    units: [unitSchema],
    learningOutcomes: [{ type: String }],
    textbooks: [{ type: String }],
    references: [{ type: String }],
    pdfPath: { type: String } // Path to the uploaded PDF file
}, {
    timestamps: true
});

// Prevent duplicate syllabus for the same course in the same academic year
syllabusSchema.index({ courseCode: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Syllabus', syllabusSchema);
