const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware not used to match eventRoutes pattern of manual verification
// const auth = require('../middleware/auth'); 

// GET /api/users/search?q=...
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        // Search by name or email, allow Students & Organizers (Hide Admins)
        const users = await User.find({
            role: { $in: ['organizer', 'student'] },
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        }).select('name role avatar bio followers'); // Exclude sensitive data

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET /api/users/:id - Profile Data
router.get('/:id', async (req, res) => {
    try {
        // We need the requester's ID to check ownership for private profiles.
        // Since this route was previously public, we check for the token header manually 
        // to determine if the viewer is the owner.
        let viewerId = null;
        const token = req.header('x-auth-token');
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                viewerId = decoded.id;
            } catch (e) { /* ignore invalid tokens for public view */ }
        }

        const user = await User.findById(req.params.id).select('-password -__v');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // PRIVACY CHECK
        const isOwner = viewerId === user._id.toString();

        // 1. Admin: Private always (unless owner)
        if (user.role === 'admin' && !isOwner) {
            return res.status(403).json({ msg: 'This profile is private.' });
        }

        // 2. Student: Semi-public (unless isDataPrivate is true)
        if (user.role === 'student' && !isOwner && user.isDataPrivate) {
            return res.status(403).json({ msg: 'This profile is private.' });
        }

        // 3. Organizer: Always Public

        // Fetch related data
        let relatedData = {};

        if (user.role === 'organizer') {
            // Organizer: Show hosted events
            const events = await Event.find({ organizer: user._id }).sort({ date: -1 });
            relatedData.events = events;
        } else if (user.role === 'student') {
            // Student: Show history (Attended/Going)
            // Visible to others now as per requirement "data... visible to others"
            const events = await Event.find({ 'attendees.user': user._id })
                .select('title date status galleryImages location startTime endTime'); // Added endTime for calendar
            relatedData.history = events;
        } else if (user.role === 'admin' && isOwner) {
            // Admin: Only if owner
            // Maybe show nothing or specific admin logs? For now empty.
        }

        res.json({ user, relatedData, isOwner });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'User not found' });
        res.status(500).send('Server Error');
    }
});

// PUT /api/users/follow/:id
router.put('/follow/:id', async (req, res) => {
    // Requires Auth
    // We need to verify the token manually here if we don't have global middleware applied yet
    // I'll assume usage like: app.use('/api/users', require('./routes/userRoutes'));
    // and this specific route should be protected.

    // Manual Token Verification to match eventRoutes.js pattern
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const currentUserId = decoded.id; // Or decoded.user.id depending on payload

        if (currentUserId === req.params.id) {
            return res.status(400).json({ msg: "Cannot follow yourself" });
        }

        const targetUser = await User.findById(req.params.id);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser || !currentUser) return res.status(404).json({ msg: 'User not found' });

        // Check if already following
        if (targetUser.followers.includes(currentUserId)) {
            // Unfollow
            await targetUser.updateOne({ $pull: { followers: currentUserId } });
            await currentUser.updateOne({ $pull: { following: req.params.id } });
            return res.json({ msg: 'Unfollowed', isFollowing: false });
        } else {
            // Follow
            await targetUser.updateOne({ $push: { followers: currentUserId } });
            await currentUser.updateOne({ $push: { following: req.params.id } });
            return res.json({ msg: 'Followed', isFollowing: true });
        }

    } catch (err) {
        console.error(err);
        res.status(401).json({ msg: 'Token is not valid' });
    }
});

module.exports = router;
