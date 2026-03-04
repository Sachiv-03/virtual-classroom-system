const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    duration: { type: Number, required: true }, // in seconds
    completed: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('FocusSession', focusSessionSchema);
