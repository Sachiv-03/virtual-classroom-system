const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'pdf', 'docx'
    size: { type: String },
    url: { type: String } // URL to download or view
});

const topicSchema = new mongoose.Schema({
    id: { type: String },
    title: { type: String, required: true },
    duration: { type: String },
    videoUrl: { type: String },
    materials: [materialSchema],
    completed: { type: Boolean, default: false }
});

const unitSchema = new mongoose.Schema({
    id: { type: String },
    title: { type: String, required: true },
    topics: [topicSchema]
});

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    teacher: { type: String },
    category: { type: String },
    schedule: [{
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        startTime: { type: String }, // Format: "09:00"
        endTime: { type: String },   // Format: "10:30"
        room: { type: String },
        meetLink: { type: String }
    }],
    thumbnail: { type: String },
    rating: { type: Number, default: 0 },
    enrolledStudents: { type: Number, default: 0 },
    lessonsCount: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    description: { type: String },
    units: [unitSchema] // Detailed syllabus structure
}, {
    timestamps: true
});

// Add indexes
courseSchema.index({ category: 1 });
courseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Course', courseSchema);
