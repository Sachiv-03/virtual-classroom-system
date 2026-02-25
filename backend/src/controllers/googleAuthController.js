const GoogleToken = require('../models/GoogleToken');
const googleMeet = require('../utils/googleMeet');

// Generate Auth URL for teacher to link their Google account
exports.getAuthUrl = (req, res) => {
    try {
        const url = googleMeet.getAuthUrl();
        res.json({ url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Handle OAuth callback and store tokens
exports.handleCallback = async (req, res) => {
    const { code } = req.query;
    const userId = req.user.id; // Assuming user is authenticated in your system

    try {
        const tokens = await googleMeet.handleAuthCallback(code);

        // Upsert tokens in DB
        await GoogleToken.findOneAndUpdate(
            { userId },
            {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date
            },
            { upsert: true, new: true }
        );

        res.send('Google Account Linked Successfully! You can close this window.');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
