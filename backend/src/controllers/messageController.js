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

    // Fetch messages where this user is sender or receiver AND hasn't "deleted for me"
    const messages = await Message.find({
        $or: [
            { senderId: senderId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: senderId }
        ],
        deletedBy: { $ne: senderId }
    })
        .populate('replyTo')
        .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
});

// @desc    Send Message
// @route   POST /api/messages/send
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
    const { receiverId, groupId, messageText, fileType, replyTo, isForwarded } = req.body;
    const senderId = req.user.id;

    let fileUrl = null;
    let fileName = null;

    if (req.file) {
        fileUrl = `/uploads/messages/${req.file.filename}`;
        fileName = req.file.originalname;
    }

    if ((!receiverId && !groupId) || (!messageText && !fileUrl)) {
        return res.status(400).json({ success: false, message: "Please provide target and content" });
    }

    const newMessage = await Message.create({
        senderId,
        receiverId: receiverId || undefined,
        groupId: groupId || undefined,
        messageText: messageText || "",
        fileUrl,
        fileName,
        fileType: fileType || 'none',
        status: 'sent',
        replyTo: replyTo || null,
        isForwarded: isForwarded || false
    });

    // If it's a group message, update group's last message
    if (groupId) {
        const Group = require('../models/Group');
        await Group.findByIdAndUpdate(groupId, { lastMessage: newMessage._id });
    }

    const populatedMessage = await Message.findById(newMessage._id)
        .populate('senderId', 'name profilePhoto')
        .populate('groupId', 'name')
        .populate('replyTo');

    res.status(201).json({ success: true, data: populatedMessage });
});

// @desc    Delete Message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = asyncHandler(async (req, res, next) => {
    const messageId = req.params.id;
    const { type } = req.body; // 'me' or 'everyone'
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
        return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (type === 'everyone') {
        if (message.senderId.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized to delete for everyone" });
        }
        message.isDeletedForEveryone = true;
        message.messageText = "This message was deleted.";
        message.fileUrl = null;
        message.fileName = null;
        message.fileType = 'none';
        await message.save();
    } else {
        // delete for me
        if (!message.deletedBy.includes(userId)) {
            message.deletedBy.push(userId);
            await message.save();
        }
    }

    res.status(200).json({ success: true, data: message });
});

// @desc    React to Message
// @route   POST /api/messages/:id/react
// @access  Private
exports.reactToMessage = asyncHandler(async (req, res, next) => {
    const messageId = req.params.id;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
        return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Check if user already reacted, if so update/remove, else add
    const existingReactionIndex = message.reactions.findIndex(r => r.userId.toString() === userId);

    if (existingReactionIndex > -1) {
        if (message.reactions[existingReactionIndex].emoji === emoji) {
            // Toggle off if clicking same emoji
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            // Update emoji
            message.reactions[existingReactionIndex].emoji = emoji;
        }
    } else {
        // Add new reaction
        message.reactions.push({ emoji, userId });
    }

    await message.save();
    res.status(200).json({ success: true, data: message });
});

// @desc    Edit Message
// @route   PUT /api/messages/:id
// @access  Private
exports.editMessage = asyncHandler(async (req, res, next) => {
    const { messageText } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(req.params.id);

    if (!message) {
        return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.senderId.toString() !== userId) {
        return res.status(403).json({ success: false, message: "Not authorized to edit this message" });
    }

    if (message.isDeletedForEveryone) {
        return res.status(400).json({ success: false, message: "Cannot edit a deleted message" });
    }

    message.messageText = messageText;
    message.isEdited = true;
    await message.save();

    await message.populate('replyTo');

    res.status(200).json({ success: true, data: message });
});

// @desc    Toggle Star Message
// @route   POST /api/messages/:id/star
// @access  Private
exports.toggleStarMessage = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const message = await Message.findById(req.params.id);

    if (!message) {
        return res.status(404).json({ success: false, message: "Message not found" });
    }

    const index = message.starredBy.indexOf(userId);
    if (index > -1) {
        message.starredBy.splice(index, 1);
    } else {
        message.starredBy.push(userId);
    }

    await message.save();
    res.status(200).json({ success: true, data: message });
});

// @desc    Toggle Pin User
// @route   POST /api/messages/pin/:userId
// @access  Private
exports.togglePinUser = asyncHandler(async (req, res, next) => {
    const userToPinId = req.params.userId;
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const index = user.pinnedChatUsers.indexOf(userToPinId);
    if (index > -1) {
        user.pinnedChatUsers.splice(index, 1);
    } else {
        user.pinnedChatUsers.push(userToPinId);
    }

    await user.save();
    res.status(200).json({ success: true, pinnedChatUsers: user.pinnedChatUsers });
});
