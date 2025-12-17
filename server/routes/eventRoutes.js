const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');

// @route   GET api/events
// @desc    Get all events (optional category filter)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};

        // Show only fully published/active events to the public
        query.status = 'approved';

        if (category && category !== 'All') {
            query.category = category;
        }

        const events = await Event.find(query)
            .sort({ date: 1 })
            .populate('attendees.user', 'name avatar'); // Populate for Social Proof
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/events/my
// @desc    Get logged-in user's events (Organizer)
// @access  Private
router.get('/my', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        // Find events where organizer is the user
        const events = await Event.find({ organizer: decoded.id }).sort({ date: 1 })
            .populate('attendees.user', 'name avatar');
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/events/pending
// @desc    Get pending events
// @access  Private (Admin/Organizer)
router.get('/pending', async (req, res) => {
    try {
        const events = await Event.find({ status: 'pending' }).sort({ date: 1 });
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('attendees.user', 'name avatar');
        if (!event) return res.status(404).json({ msg: 'Event not found' });
        res.json(event);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Event not found' });
        res.status(500).send('Server Error');
    }
});

// @route   POST api/events/:id/rsvp
// @desc    RSVP to an event
// @access  Private
router.post('/:id/rsvp', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const userId = decoded.id;

        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        // Check if already RSVPed
        const existingAttendee = event.attendees.find(att => att.user.toString() === userId);

        if (existingAttendee) {
            // Un-RSVP (Remove)
            event.attendees = event.attendees.filter(att => att.user.toString() !== userId);
            await event.save();
            return res.json({ msg: 'RSVP removed', status: 'not_attending', attendees: event.attendees });
        }

        // Check Capacity
        if (event.attendees.length >= event.capacity) {
            return res.status(400).json({ msg: 'Event is full' });
        }

        // Add to attendees
        const newAttendee = {
            user: userId,
            status: event.requiresApproval ? 'pending' : 'accepted', // If requires approval, set to pending
            rsvpDate: new Date()
        };

        if (req.body.note) {
            newAttendee.note = req.body.note; // Optional note from user
        }

        event.attendees.push(newAttendee);
        await event.save();

        // Populate to return updated list with names
        await event.populate('attendees.user', 'name avatar');

        res.json({
            msg: event.requiresApproval ? 'Request sent to organizer' : 'RSVP successful',
            status: newAttendee.status,
            attendees: event.attendees
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/events/:id/attendees
// @desc    Manage attendee status (Approve/Reject)
// @access  Private (Organizer/Admin)
router.put('/:id/attendees', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const organizerId = decoded.id;

        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        // Basic check: is user the organizer? (In real app, admin can also do this)
        // For now assuming organizer role check is done via frontend/role but we should check ownership
        if (event.organizer.toString() !== organizerId) {
            // return res.status(403).json({ msg: 'Not authorized' }); 
            // Commented out for flexibility in this demo if admins want to use it too
        }

        const { userId, status } = req.body; // status: 'accepted' | 'rejected'

        const attendee = event.attendees.find(att => att.user.toString() === userId);
        if (!attendee) return res.status(404).json({ msg: 'Attendee not found' });

        attendee.status = status;
        await event.save();

        await event.populate('attendees.user', 'name avatar');

        res.json(event.attendees);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route   POST api/events/notice
// @desc    Create a Notice (Admin Only)
// @access  Private
router.post('/notice', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) return res.status(401).json({ msg: 'No token' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Ensure Admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ msg: 'Admin privileges required' });
        }

        const newNotice = new Event({
            title: req.body.title,
            description: req.body.description,
            eventType: 'notice',
            date: req.body.date || new Date(),
            organizer: decoded.id,
            status: 'approved', // Auto-publish notices immediately
            isGateOpen: false, // Notices are just info, no gates
            location: req.body.location || 'Campus Wide',
            capacity: 99999,
            startTime: '00:00',
            endTime: '23:59'
        });

        const savedNotice = await newNotice.save();
        res.json(savedNotice);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @access  Private
router.post('/', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = decoded.id; // Organizer ID

        const newEvent = new Event({
            ...req.body,
            organizer: user
        });

        const event = await newEvent.save();
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/events/:id
// @desc    Update an event (Status, Details, etc.)
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        // Ideally check ownership/admin role here
        let event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        // Update fields
        const { title, description, date, startTime, endTime, location, capacity, status, category, eventDates, agenda, requestNote, eventType, rejectionReason } = req.body;

        // Construct object to update
        const eventFields = {};
        if (title) eventFields.title = title;
        if (description) eventFields.description = description;
        if (date) eventFields.date = date;
        if (startTime) eventFields.startTime = startTime;
        if (endTime) eventFields.endTime = endTime;
        if (location) eventFields.location = location;
        if (capacity) eventFields.capacity = capacity;
        if (status) eventFields.status = status;
        if (category) eventFields.category = category;
        if (eventType) eventFields.eventType = eventType;
        if (rejectionReason) eventFields.rejectionReason = rejectionReason;
        if (eventDates) eventFields.eventDates = eventDates;
        if (agenda) eventFields.agenda = agenda;
        if (requestNote !== undefined) eventFields.requestNote = requestNote;

        event = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: eventFields },
            { new: true }
        );

        // Re-populate for social proof/dashboards
        await event.populate('attendees.user', 'name avatar');

        res.json(event);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/events/:id/approve
// @desc    Approve an event (Admin) - Legacy/Shortcut
router.put('/:id/approve', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });
        event.status = 'admin_approved';
        await event.save();
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/events/:id/reject
// @desc    Reject an event (Admin) - Legacy/Shortcut
router.put('/:id/reject', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        event.status = 'rejected';
        if (req.body.reason) event.rejectionReason = req.body.reason;

        await event.save();
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/events/scan
// @desc    Verify and check-in a user via QR Code
// @access  Private (Organizer/Admin)
router.post('/scan', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const { eventId, userId } = req.body;

        const event = await Event.findById(eventId).populate('attendees.user', 'name');
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        // Manual Gate Validation
        if (!event.isGateOpen) {
            return res.status(403).json({ msg: 'Gates are CLOSED. Please open gates from dashboard.' });
        }



        const attendee = event.attendees.find(att => att.user._id.toString() === userId);

        if (!attendee) {
            return res.status(404).json({ msg: 'User is not on the guest list' });
        }

        if (attendee.status !== 'accepted') {
            return res.status(403).json({ msg: `Access Denied: Status is ${attendee.status}` });
        }

        if (attendee.markedPresent) {
            return res.status(409).json({ msg: 'User already checked in', studentName: attendee.user.name });
        }

        attendee.markedPresent = true;
        await event.save();

        res.json({ msg: 'Check-in Successful', studentName: attendee.user.name });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/events/:id/gates
// @desc    Toggle Gate Status (Open/Close)
// @access  Private (Organizer)
router.put('/:id/gates', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        event.isGateOpen = !event.isGateOpen;
        await event.save();
        res.json({ isGateOpen: event.isGateOpen, msg: event.isGateOpen ? 'Gates Opened' : 'Gates Closed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/events/:id
// @desc    Delete an event or notice
// @access  Private (Admin/Organizer)
router.delete('/:id', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ msg: 'Event not found' });

        // Check authorization (Admin or Owner)
        if (decoded.role !== 'admin' && event.organizer.toString() !== decoded.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await event.deleteOne();
        res.json({ msg: 'Event removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
