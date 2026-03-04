const Message = require('../models/Message');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
    // Find all unique users the current user has sent messages to or received messages from
    const userId = req.user.id;

    // Aggregation pipeline to get unique latest messages per user
    const conversations = await Message.aggregate([
        {
            $match: {
                $or: [{ sender: userId }, { receiver: userId }]
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: {
                _id: {
                    $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"]
                },
                latestMessage: { $first: "$$ROOT" }
            }
        }
    ]);

    // Populate user details for each conversation partner
    const populatedConversations = await User.populate(conversations, {
        path: '_id',
        select: 'name email role'
    });

    const formattedConversations = populatedConversations.map(conv => {
        const otherUser = conv._id;
        const msg = conv.latestMessage;
        return {
            userId: otherUser._id,
            name: otherUser.name,
            role: otherUser.role,
            latestMessage: msg.content,
            timestamp: msg.createdAt,
            unread: msg.receiver.toString() === userId.toString() && !msg.read
        };
    }).filter(c => c.name); // filter out if user was deleted

    res.status(200).json({
        success: true,
        data: formattedConversations
    });
});

// @desc    Get messages with a specific user
// @route   GET /api/messages/:userId
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
        $or: [
            { sender: currentUserId, receiver: otherUserId },
            { sender: otherUserId, receiver: currentUserId }
        ]
    }).sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
        { sender: otherUserId, receiver: currentUserId, read: false },
        { $set: { read: true } }
    );

    res.status(200).json({
        success: true,
        data: messages
    });
});

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content) {
        return next(new ErrorResponse('Please provide receiver and content', 400));
    }

    const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content
    });

    res.status(201).json({
        success: true,
        data: message
    });
});

// @desc    Search users to start conversation
// @route   GET /api/messages/users/search?q=query
// @access  Private
exports.searchUsers = asyncHandler(async (req, res, next) => {
    const query = req.query.q;
    if (!query) return res.status(200).json({ success: true, data: [] });

    // Find users except current user
    const users = await User.find({
        _id: { $ne: req.user.id },
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
        ]
    }).select('name email role').limit(10);

    res.status(200).json({
        success: true,
        data: users
    });
});
