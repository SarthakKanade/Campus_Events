const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Event = require('./models/Event');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campusevents')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

const addEvent = async () => {
    try {
        const organizer = await User.findOne({ role: 'organizer' });
        if (!organizer) {
            console.log('No organizer found. Please run seed.js first.');
            process.exit(1);
        }

        const newEvent = new Event({
            title: 'Networking Night',
            description: 'Meet alumni and industry professionals.',
            date: new Date('2025-12-08'), // 2 days from "now"
            startTime: '18:00',
            endTime: '21:00',
            location: 'Auditorium',
            organizer: organizer._id,
            status: 'approved'
        });

        await newEvent.save();
        console.log(`Event Created: ${newEvent.title} on ${newEvent.date}`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

addEvent();
