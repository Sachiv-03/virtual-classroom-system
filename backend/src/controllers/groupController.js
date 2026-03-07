const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
exports.createGroup = asyncHandler(async (req, res, next) => {
    const { name, description, memberIds } = req.body;

    // Add creator to members if not already there
    const members = [...new Set([...memberIds, req.user.id])];

    const group = await Group.create({
        name,
        description,
        members,
        admins: [req.user.id],
        createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: group });
});

// @desc    Get user groups
// @route   GET /api/groups
// @access  Private
exports.getGroups = asyncHandler(async (req, res, next) => {
    const groups = await Group.find({ members: req.user.id })
        .populate('members', 'name email profilePhoto role onlineStatus')
        .populate('admins', 'name')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: groups });
});

// @desc    Get group details
// @route   GET /api/groups/:groupId
// @access  Private
exports.getGroupDetails = asyncHandler(async (req, res, next) => {
    const group = await Group.findById(req.params.groupId)
        .populate('members', 'name email profilePhoto role onlineStatus')
        .populate('admins', 'name');

    if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (!group.members.some(m => m._id.toString() === req.user.id)) {
        return res.status(403).json({ success: false, message: "Not a member of this group" });
    }

    res.status(200).json({ success: true, data: group });
});

// @desc    Get Group Conversation
// @route   GET /api/groups/:groupId/messages
// @access  Private
exports.getGroupMessages = asyncHandler(async (req, res, next) => {
    const { groupId } = req.params;

    // Verify membership
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(req.user.id)) {
        return res.status(403).json({ success: false, message: "Access denied" });
    }

    const messages = await Message.find({
        groupId,
        deletedBy: { $ne: req.user.id }
    })
        .populate('senderId', 'name profilePhoto')
        .populate('replyTo')
        .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
});

// @desc    Add members to group
// @route   PUT /api/groups/:groupId/add
// @access  Private (Admins only)
exports.addGroupMembers = asyncHandler(async (req, res, next) => {
    const { memberIds } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // Check if requester is admin
    if (!group.admins.includes(req.user.id)) {
        return res.status(403).json({ success: false, message: "Only admins can add members" });
    }

    group.members = [...new Set([...group.members, ...memberIds])];
    await group.save();

    res.status(200).json({ success: true, data: group });
});

// @desc    Remove member from group
// @route   PUT /api/groups/:groupId/remove
// @access  Private (Admins only)
exports.removeGroupMember = asyncHandler(async (req, res, next) => {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    if (!group.admins.includes(req.user.id)) {
        return res.status(403).json({ success: false, message: "Only admins can remove members" });
    }

    group.members = group.members.filter(m => m.toString() !== userId);
    group.admins = group.admins.filter(a => a.toString() !== userId);

    await group.save();
    res.status(200).json({ success: true, data: group });
});

// @desc    Leave group
// @route   PUT /api/groups/:groupId/leave
// @access  Private
exports.leaveGroup = asyncHandler(async (req, res, next) => {
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    group.members = group.members.filter(m => m.toString() !== req.user.id);
    group.admins = group.admins.filter(a => a.toString() !== req.user.id);

    // If no admins left, promote someone else
    if (group.members.length > 0 && group.admins.length === 0) {
        group.admins.push(group.members[0]);
    }

    await group.save();
    res.status(200).json({ success: true, message: "Left group successfully" });
});
