const mongoose = require('mongoose');

const classroomMessageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    sender: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        role: String
    },
    text: {
        type: String,
        required: true
    },
    isAnnouncement: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('ClassroomMessage', classroomMessageSchema);
