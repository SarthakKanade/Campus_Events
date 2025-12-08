const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

// POST /api/events - Create Event (Organizer only)
router.post('/', [authMiddleware, roleCheck(['organizer', 'admin'])], async (req, res) => {
    try {
        const { title, description, date, startTime, endTime, location, capacity, endDate, agenda, eventDates, requestNote } = req.body;

        const newEvent = new Event({
            title,
            description,
            date,
            startTime,
            endTime,
            location,
            capacity, // Optional, defaults to 100 if undefined
            endDate,  // Optional
            agenda,   // Optional
            eventDates, // Array of specific dates/times
            requestNote, // Note to admin
            organizer: req.user.id,
            status: 'pending' // Default to pending
        });

        const savedEvent = await newEvent.save();
        res.json(savedEvent);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/events - Public (Only approved events)
router.get('/', async (req, res) => {
    try {
        const events = await Event.find({ status: 'approved' }).populate('organizer', 'name');
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/events/pending - Admin Only
router.get('/pending', [authMiddleware, roleCheck(['admin'])], async (req, res) => {
    try {
        const events = await Event.find({ status: 'pending' }).populate('organizer', 'name email');
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /api/events/:id/approve - Admin only
router.put('/:id/approve', [authMiddleware, roleCheck(['admin'])], async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        if (event.status === 'approved') {
            return res.status(400).json({ msg: 'Event already approved' });
        }

        // CONFLICT CHECK LOGIC
        // Check for other APPROVED events at the same location on the same date
        // and overlapping time.
        // Simple overlap check: (StartA <= EndB) and (EndA >= StartB)

        // Note: Date comparison should disregard time part if stored as Date object with 00:00:00
        // or compare efficiently. 
        // Assuming 'date' is stored as ISO Date. match strictly.

        const conflictingEvents = await Event.find({
            status: 'approved',
            location: event.location,
            date: event.date,
            $or: [
                // New event starts during existing event
                { startTime: { $lt: event.endTime }, endTime: { $gt: event.startTime } }
                // Note: String comparison of "HH:mm" works for 24h format e.g. "09:00" < "10:00"
            ]
        });

        // Refined Overlap Logic for Strings "HH:mm":
        // Condition for overlap: Not (EndA <= StartB or StartA >= EndB)
        // => NewEvent overlaps ExistingEvent if:
        // NewEventKeys.Start < ExistingEvent.End AND NewEvent.End > ExistingEvent.Start

        // Let's implement the query correctly using $and for clarity if needed, or query all approved events on that day/location and filter in JS
        // Querying in Mongo for string ranges:
        /*
            We need to find if there is any event E where:
            E.startTime < event.endTime AND E.endTime > event.startTime
        */

        const conflicts = await Event.find({
            _id: { $ne: event._id }, // Exclude self
            status: 'approved',
            location: event.location,
            date: event.date,
            startTime: { $lt: event.endTime },
            endTime: { $gt: event.startTime }
        });

        if (conflicts.length > 0) {
            return res.status(400).json({
                msg: 'Venue conflict detected',
                conflicts: conflicts.map(e => ({ title: e.title, time: `${e.startTime}-${e.endTime}` }))
            });
        }

        event.status = 'approved';
        await event.save();

        res.json(event);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/events/:id - Get Single Event
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email')
            .populate('attendees.user', 'name'); // Populate user inside attendees array

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        res.json(event);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Event not found' });
        }
        res.status(500).send('Server Error');
    }
});

// POST /api/events/:id/rsvp - Toggle RSVP (Student/User)
router.post('/:id/rsvp', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });
        if (event.status !== 'approved') return res.status(400).json({ msg: 'Cannot RSVP to non-approved events' });

        const existingAttendeeIndex = event.attendees.findIndex(a => a.user.toString() === req.user.id);

        if (existingAttendeeIndex !== -1) {
            // Un-RSVP
            event.attendees.splice(existingAttendeeIndex, 1);
            await event.save();
            return res.json({ msg: 'RSVP removed', status: 'not-attending', attendees: event.attendees });
        } else {
            // CAPACITY CHECK
            if (event.attendees.length >= event.capacity) {
                return res.status(400).json({ msg: 'Event is Full!' });
            }

            // RSVP
            event.attendees.push({ user: req.user.id, markedPresent: false });
            await event.save();
            return res.json({ msg: 'RSVP successful', status: 'attending', attendees: event.attendees });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POLLS ROUTES
// POST /api/events/:id/polls - Create Poll (Organizer)
router.post('/:id/polls', [authMiddleware, roleCheck(['organizer', 'admin'])], async (req, res) => {
    try {
        const { question, options } = req.body;
        // options = ["Pizza", "Burger"]
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        if (event.organizer.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const newPoll = {
            question,
            options: options.map(opt => ({ text: opt, votes: 0 })),
            active: true,
            voters: []
        };

        event.polls.push(newPoll);
        await event.save();
        res.json(event.polls); // Return all polls
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /api/events/:id/vote - Vote (Student)
router.post('/:id/vote', authMiddleware, async (req, res) => {
    try {
        const { pollId, optionIndex } = req.body;
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        const poll = event.polls.id(pollId);
        if (!poll) return res.status(404).json({ msg: 'Poll not found' });
        if (!poll.active) return res.status(400).json({ msg: 'Poll is closed' });

        // Check if voted
        if (poll.voters.includes(req.user.id)) {
            return res.status(400).json({ msg: 'You already voted' });
        }

        poll.options[optionIndex].votes++;
        poll.voters.push(req.user.id);

        await event.save();
        res.json(poll);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /api/events/scan - Verify Attendance (Organizer/Admin)
router.post('/scan', [authMiddleware, roleCheck(['organizer', 'admin'])], async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Verify user is rsvpd
        const attendee = event.attendees.find(a => a.user.toString() === userId);

        if (!attendee) {
            return res.status(400).json({ msg: 'Student has not RSVPd for this event', success: false });
        }

        if (attendee.markedPresent) {
            return res.status(400).json({ msg: 'Student already checked in', success: false });
        }

        // Mark Present
        attendee.markedPresent = true;
        await event.save();

        // Need student name for display
        // We can fetch user or if populated but here it is mixed
        // Better to populate just this one or use return value
        // Let's populate the event fully to return the name
        await event.populate('attendees.user', 'name');
        const updatedAttendee = event.attendees.find(a => a.user._id.toString() === userId);

        res.json({
            success: true,
            msg: 'Check-in Successful',
            studentName: updatedAttendee.user.name
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/events/:id/feedback - Add Rating & Comment
router.post('/:id/feedback', authMiddleware, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ msg: 'Event not found' });

        // Prevent duplicate feedback
        const alreadyReviewed = event.feedback.find(r => r.user.toString() === req.user.id);
        if (alreadyReviewed) {
            return res.status(400).json({ msg: 'You have already reviewed this event' });
        }

        const newFeedback = {
            user: req.user.id,
            rating: Number(rating),
            comment,
        };

        event.feedback.push(newFeedback);

        // Calculate Average
        event.averageRating = event.feedback.reduce((acc, item) => item.rating + acc, 0) / event.feedback.length;

        await event.save();
        res.json({ msg: 'Feedback added' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /api/events/:id - Update Event
// If Admin/Organizer: Can update status/gallery.
// If Organizer + Status=Pending: Can update details (Edit Request).
router.put('/:id', [authMiddleware, roleCheck(['organizer', 'admin'])], async (req, res) => {
    try {
        const { status, galleryImages, title, description, date, startTime, endTime, location, capacity, agenda, eventDates, requestNote } = req.body;
        let event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ msg: 'Event not found' });

        // Ensure owner or admin
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // If updating status/gallery (existing logic for 'completed')
        if (status) event.status = status;
        if (galleryImages) event.galleryImages = galleryImages;

        // NEW: Allow editing details if PENDING (or if Admin)
        // Organizer usually can only edit if pending or rejected (to resubmit)
        if (event.status === 'pending' || event.status === 'rejected' || req.user.role === 'admin') {
            if (title) event.title = title;
            if (description) event.description = description;
            if (date) event.date = date;
            if (startTime) event.startTime = startTime;
            if (endTime) event.endTime = endTime;
            if (location) event.location = location;
            if (capacity) event.capacity = capacity;
            if (agenda) event.agenda = agenda;
            if (eventDates) event.eventDates = eventDates;
            if (requestNote) event.requestNote = requestNote;

            // If it was rejected and organizer edits it, reset to pending?
            // Yes, "Re-submitting"
            if (event.status === 'rejected' && req.user.role === 'organizer') {
                event.status = 'pending';
                event.rejectionReason = null; // Clear previous rejection
            }
        }

        await event.save();
        res.json(event);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /api/events/:id/reject - Reject Event (Admin Only)
router.put('/:id/reject', [authMiddleware, roleCheck(['admin'])], async (req, res) => {
    try {
        const { reason } = req.body;
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        event.status = 'rejected';
        event.rejectionReason = reason || 'No reason provided';

        await event.save();
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

