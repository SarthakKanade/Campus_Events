const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date, // Optional, for multi-day events
        default: null
    },
    startTime: {
        type: String, // Format: "HH:mm"
        required: true
    },
    endTime: {
        type: String, // Format: "HH:mm"
        required: true
    },
    location: {
        type: String,
        required: true
    },
    eventType: {
        type: String,
        enum: ['standard', 'notice'],
        default: 'standard'
    },
    category: {
        type: String,
        enum: ['Music', 'Tech', 'Workshop', 'Social', 'Sports', 'Other'],
        default: 'Other'
    },
    rsvpStart: { type: Date },
    rsvpEnd: { type: Date },
    rsvpDeadline: { type: Date }, // Separate deadline day
    rsvpDeadlineTime: { type: String }, // Separate deadline time
    isGateOpen: { type: Boolean, default: false }, // Manual gate control
    requiresApproval: { type: Boolean, default: false },
    capacity: {
        type: Number,
        required: true,
        default: 100 // Default for existing seeds
    },
    agenda: [{
        title: { type: String, required: true },
        startTime: String,
        endTime: String,
        description: String,
        date: { type: Date } // Which day of the event this item belongs to
    }],
    polls: [{
        question: String,
        options: [{
            text: String,
            votes: { type: Number, default: 0 }
        }],
        active: { type: Boolean, default: true },
        // Track who voted to prevent double voting? simpler for now: just counts.
        voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attendees: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'accepted'
        },
        note: String,
        markedPresent: {
            type: Boolean,
            default: false
        }
    }],
    eventDates: [{
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        location: { type: String } // Optional override per day
    }],
    requestNote: { type: String }, // Organizer -> Admin
    rejectionReason: { type: String }, // Admin -> Organizer
    status: {
        type: String,
        enum: ['pending', 'admin_approved', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    galleryImages: [{
        type: String // URLs to images
    }],
    feedback: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true },
        comment: { type: String },
        date: { type: Date, default: Date.now }
    }],
    averageRating: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Constraint: Ensure no two APPROVED events can have the same location at the same startTime on the same date.
// We'll leave the validation logic for the API level (approve route) as Mongo unique indexes 
// are tricky with overlapping time ranges and status conditions. 
// However, we can add a pre-save hook or just rely on the controller logic as requested.
// The user asked for "Constraint: Ensure no two approved events..." in the model description.
// Simplest way is a unique compound index ONLY if we have exact match. 
// But time ranges are ranges. So we will implement the check in the Controller/Service level 
// as "The Logic" for event approval.

module.exports = mongoose.model('Event', eventSchema);
