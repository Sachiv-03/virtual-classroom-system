const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const Course = require('./src/models/Course');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const roles = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        console.log('User roles:', roles);

        const students = await User.find({ role: 'student' }).select('name enrolledCourses');
        console.log('Students:', JSON.stringify(students, null, 2));

        const courses = await Course.find().select('title teacher teacherId');
        console.log('Courses:', JSON.stringify(courses, null, 2));
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
