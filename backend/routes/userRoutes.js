const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, jwtAuthMiddleware } = require('../jwt');

// POST /api/users/signup
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        const token = generateToken(user._id);
        res.status(201).json({
            token,
            userId: user._id,
            username: user.username
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/users/signin
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        res.json({
            token,
            userId: user._id,
            username: user.username
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/users/search?query=username
router.get('/search', jwtAuthMiddleware, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user.id }
        }).select('_id username email').limit(10);

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/users/me
router.get('/me', jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
