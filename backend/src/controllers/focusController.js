const FocusSession = require('../models/FocusSession');
const asyncHandler = require('../utils/asyncHandler');

exports.logFocusSession = asyncHandler(async (req, res, next) => {
    const { duration } = req.body;

    if (!duration) {
        return res.status(400).json({ success: false, message: 'Please provide session duration' });
    }

    const session = await FocusSession.create({
        user: req.user.id,
        duration,
        completed: true
    });
    res.status(201).json({ success: true, data: session });
});
