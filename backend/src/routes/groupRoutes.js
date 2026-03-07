const express = require('express');
const router = express.Router();
const {
    createGroup, getGroups, getGroupDetails, getGroupMessages,
    addGroupMembers, removeGroupMember, leaveGroup
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // If we want group photos eventually

router.use(protect); // All group routes protected

router.route('/')
    .get(getGroups)
    .post(createGroup);

router.route('/:groupId')
    .get(getGroupDetails);

router.get('/:groupId/messages', getGroupMessages);

router.put('/:groupId/add', addGroupMembers);
router.put('/:groupId/remove', removeGroupMember);
router.put('/:groupId/leave', leaveGroup);

module.exports = router;
