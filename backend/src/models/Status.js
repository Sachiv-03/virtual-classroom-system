const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contentUrl: {
        type: String,
        default: null
    },
    contentType: {
        type: String,
        enum: ['image', 'video', 'text'],
        required: true
    },
    text: {
        type: String,
        default: ""
    },
    viewedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // 24 hours in seconds
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Status', statusSchema);
