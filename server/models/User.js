const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'organizer', 'admin'],
        required: true
    },
    studentID: {
        type: String,
        required: function () { return this.role === 'student'; } // Only required if role is student
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
