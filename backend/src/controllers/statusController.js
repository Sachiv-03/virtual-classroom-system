const Status = require('../models/Status');
const User = require('../models/User');

// Create a new status
exports.createStatus = async (req, res) => {
    try {
        const { contentType, text } = req.body;
        let contentUrl = null;

        if (req.file) {
            contentUrl = `/uploads/statuses/${req.file.filename}`;
        }

        const status = await Status.create({
            userId: req.user.id,
            contentType,
            contentUrl,
            text
        });

        const populatedStatus = await Status.findById(status._id).populate('userId', 'name role');

        res.status(201).json({
            success: true,
            data: populatedStatus
        });
    } catch (err) {
        res.status(500).json({
            success: true,
            message: err.message
        });
    }
};

// Get all statuses from users that the current user might be interested in (e.g. all users for now in virtual classroom)
exports.getStatuses = async (req, res) => {
    try {
        // Find all statuses created in the last 24 hours (automatic via TTL but double check if needed)
        // MongoDB TTL handles deletion, so we just find all that exist.
        const statuses = await Status.find()
            .populate('userId', 'name role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: statuses
        });
    } catch (err) {
        res.status(500).json({
            success: true,
            message: err.message
        });
    }
};

// View a status
exports.viewStatus = async (req, res) => {
    try {
        const status = await Status.findById(req.params.id);
        if (!status) {
            return res.status(404).json({ success: false, message: 'Status not found' });
        }

        if (!status.viewedBy.includes(req.user.id)) {
            status.viewedBy.push(req.user.id);
            await status.save();
        }

        res.status(200).json({
            success: true,
            data: status
        });
    } catch (err) {
        res.status(500).json({
            success: true,
            message: err.message
        });
    }
};

// Delete status
exports.deleteStatus = async (req, res) => {
    try {
        const status = await Status.findById(req.params.id);
        if (!status) {
            return res.status(404).json({ success: false, message: 'Status not found' });
        }

        if (status.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await status.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Status deleted'
        });
    } catch (err) {
        res.status(500).json({
            success: true,
            message: err.message
        });
    }
};
