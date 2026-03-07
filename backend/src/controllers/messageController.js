const Message = require('../models/Message');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get Chat Users
// @route   GET /api/messages/users
// @access  Private
exports.getChatUsers = asyncHandler(async (req, res, next) => {
    // Return all users except the currently logged in user
    const users = await User.find({ _id: { $ne: req.user.id } })
        .select('name email role');

    res.status(200).json({ success: true, data: users });
});

// @desc    Get Conversation
// @route   GET /api/messages/:userId
// @access  Private
exports.getConversation = asyncHandler(async (req, res, next) => {
    const { userId: userToChatId } = req.params;
    const senderId = req.user.id;

    const messages = await Message.find({
        $or: [
            { senderId: senderId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: senderId }
        ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
});

// @desc    Send Message
// @route   POST /api/messages/send
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
    const { receiverId, messageText } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !messageText) {
        return res.status(400).json({ success: false, message: "Please provide receiverId and messageText" });
    }

    const newMessage = await Message.create({
        senderId,
        receiverId,
        messageText,
    });

    res.status(201).json({ success: true, data: newMessage });
});
