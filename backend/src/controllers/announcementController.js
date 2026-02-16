const Announcement = require('../models/Announcement');

// Add Announcement
exports.createAnnouncement = async (req, res) => {
    try {
        const announcement = new Announcement({
            content: req.body.content,
            author: req.user._id // Assuming middleware sets req.user
        });
        const savedAnnouncement = await announcement.save();
        res.status(201).json(savedAnnouncement);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get All Announcements
exports.getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('author', 'name role') // Populate author details
            .sort({ createdAt: -1 }); // Newest first
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Latest Announcements
exports.getLatestAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('author', 'name role')
            .sort({ createdAt: -1 })
            .limit(5);
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
