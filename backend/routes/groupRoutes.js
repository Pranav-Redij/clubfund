const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const { jwtAuthMiddleware } = require('../jwt');

// POST /api/groups/create
router.post('/create', jwtAuthMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        const group = new Group({
            name,
            description: description || '',
            createdBy: req.user.id,
            members: [req.user.id]
        });
        await group.save();

        const populated = await Group.findById(group._id).populate('members', 'username email');
        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/groups/mygroups
router.get('/mygroups', jwtAuthMiddleware, async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user.id })
            .populate('members', 'username email')
            .populate('createdBy', 'username');
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/groups/:groupId
router.get('/:groupId', jwtAuthMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate('members', 'username email')
            .populate('createdBy', 'username');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const isMember = group.members.some(m => m._id.toString() === req.user.id);
        if (!isMember) {
            return res.status(403).json({ message: 'Not a member of this group' });
        }

        res.json(group);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/groups/:groupId/addmember
router.post('/:groupId/addmember', jwtAuthMiddleware, async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the group creator can add members' });
        }

        const userToAdd = await User.findById(userId);
        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found' });
        }

        const alreadyMember = group.members.some(m => m.toString() === userId);
        if (alreadyMember) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        group.members.push(userId);
        await group.save();

        const populated = await Group.findById(group._id).populate('members', 'username email');
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
