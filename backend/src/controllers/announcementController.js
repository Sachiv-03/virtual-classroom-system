const Announcement = require('../models/Announcement');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Add Announcement
// @route   POST /api/announcements
// @access  Private/Teacher
exports.createAnnouncement = asyncHandler(async (req, res, next) => {
    const announcement = await Announcement.create({
        content: req.body.content,
        author: req.user.id
    });

    res.status(201).json({
        success: true,
        data: announcement
    });
});

// @desc    Get All Announcements
// @route   GET /api/announcements
// @access  Private
exports.getAllAnnouncements = asyncHandler(async (req, res, next) => {
    const announcements = await Announcement.find()
        .populate('author', 'name role')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: announcements.length,
        data: announcements
    });
});

// @desc    Get Latest Announcements
// @route   GET /api/announcements/latest
// @access  Private
exports.getLatestAnnouncements = asyncHandler(async (req, res, next) => {
    const announcements = await Announcement.find()
        .populate('author', 'name role')
        .sort({ createdAt: -1 })
        .limit(5);

    res.status(200).json({
        success: true,
        count: announcements.length,
        data: announcements
    });
});
