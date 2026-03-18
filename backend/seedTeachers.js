const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const teachers = [
    {
        name: 'Mr. David Lee',
        email: 'david.lee@example.com',
        password: 'password123',
        role: 'teacher',
        department: 'Technology'
    },
    {
        name: 'Dr. Sarah Wilson',
        email: 'sarah.wilson@example.com',
        password: 'password123',
        role: 'teacher',
        department: 'Science'
    },
    {
        name: 'Prof. Michael Chen',
        email: 'michael.chen@example.com',
        password: 'password123',
        role: 'teacher',
        department: 'Mathematics'
    },
    {
        name: 'Ms. Emily Brown',
        email: 'emily.brown@example.com',
        password: 'password123',
        role: 'teacher',
        department: 'Languages'
    }
];

const seedTeachers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        for (const teacher of teachers) {
            const exists = await User.findOne({ email: teacher.email });
            if (!exists) {
                await User.create(teacher);
                console.log(`Created teacher: ${teacher.name}`);
            } else {
                console.log(`Teacher already exists: ${teacher.name}`);
            }
        }

        console.log('Teacher seeding completed!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedTeachers();
