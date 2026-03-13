const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from current dir (backend/.env)
dotenv.config();

const User = require('./src/models/User');
const Course = require('./src/models/Course');

const checkUser = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const userEmail = 'sachiv@email.com';
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.log(`User with email ${userEmail} not found.`);
            const allUsers = await User.find({}).limit(5);
            console.log('Available users:', allUsers.map(u => u.email));
            process.exit(0);
        }

        console.log('--- User Info ---');
        console.log(`ID: ${user._id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Role: ${user.role}`);
        
        if (user.role === 'teacher' || user.role === 'admin') {
            const query = user.role === 'admin' ? {} : { teacherId: user._id };
            const courses = await Course.find(query);
            console.log(`--- Teaching/Admin Courses (${courses.length}) ---`);
            courses.forEach(c => {
                console.log(`- Course: ${c.title}, ID: ${c._id}, Schedule items: ${c.schedule?.length || 0}`);
                if (c.schedule && c.schedule.length > 0) {
                    console.log('  Schedule:', JSON.stringify(c.schedule, null, 2));
                }
            });
        } else {
            // Student
            console.log(`Enrolled Courses Count: ${user.enrolledCourses?.length || 0}`);
            const populatedUser = await User.findById(user._id).populate('enrolledCourses');
            console.log('--- Enrolled Courses ---');
            populatedUser.enrolledCourses.forEach(c => {
                console.log(`- Course: ${c.title}, ID: ${c._id}, Schedule items: ${c.schedule?.length || 0}`);
                if (c.schedule && c.schedule.length > 0) {
                    console.log('  Schedule:', JSON.stringify(c.schedule, null, 2));
                }
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUser();
