const mongoose = require('mongoose');

const googleTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    accessToken: String,
    refreshToken: String,
    expiryDate: Number,
}, { timestamps: true });

module.exports = mongoose.model('GoogleToken', googleTokenSchema);
