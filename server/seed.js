const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campusevents')
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        // Clear Database
        await User.deleteMany({});
        await Event.deleteMany({});
        console.log('Database Cleared');

        // Create Users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const admin = new User({ name: 'Admin User', email: 'admin@college.edu', password: hashedPassword, role: 'admin' });

        const organizer1 = new User({ name: 'Coding Club', email: 'coding@college.edu', password: hashedPassword, role: 'organizer' });
        const organizer2 = new User({ name: 'Drama Club', email: 'drama@college.edu', password: hashedPassword, role: 'organizer' });

        const students = [];
        for (let i = 1; i <= 5; i++) {
            students.push(new User({
                name: `Student ${i}`,
                email: `student${i}@college.edu`,
                password: hashedPassword,
                role: 'student',
                studentID: `S202300${i}`
            }));
        }

        await admin.save();
        await organizer1.save();
        await organizer2.save();
        await User.insertMany(students);

        console.log('Users Created: 1 Admin, 2 Organizers, 5 Students');

        // Create Events
        // Approved Event 1 (Coding Workshop)
        const event1 = new Event({
            title: 'Intro to MERN',
            description: 'Learn the basics of MERN stack',
            date: new Date('2025-01-15'),
            startTime: '10:00',
            endTime: '12:00',
            location: 'Lab A',
            organizer: organizer1._id,
            status: 'approved'
        });

        // Approved Event 2 (Drama Rehearsal)
        const event2 = new Event({
            title: 'Annual Play Rehearsal',
            description: 'First run through',
            date: new Date('2025-01-16'),
            startTime: '14:00',
            endTime: '18:00',
            location: 'Auditorium',
            organizer: organizer2._id,
            status: 'approved'
        });

        // Pending Event (Hackathon - coding club)
        const event3 = new Event({
            title: 'Winter Hackathon',
            description: '24 hour coding challenge',
            date: new Date('2025-01-20'),
            startTime: '09:00',
            endTime: '09:00', // Next day technically, but for checking we assume simplistically
            location: 'Auditorium',
            organizer: organizer1._id,
            status: 'pending'
        });

        await event1.save();
        await event2.save();
        await event3.save();

        console.log('Events Created: 2 Approved, 1 Pending');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
