const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Course = require('./src/models/Course');
const User = require('./src/models/User');

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const courses = await Course.find().populate('teacherId', 'name email role');
        console.log('\n--- COURSES ---');
        courses.forEach(c => {
            console.log(`Course: ${c.title}`);
            console.log(`  Teacher Name (string): ${c.teacher}`);
            console.log(`  Teacher Ref (ID): ${c.teacherId?._id}`);
            console.log(`  Teacher Ref (Name): ${c.teacherId?.name}`);
            console.log(`  Teacher Ref (Role): ${c.teacherId?.role}`);
        });

        const students = await User.find({ role: 'student' });
        console.log('\n--- STUDENTS ENROLLMENTS ---');
        students.forEach(s => {
            console.log(`Student: ${s.name} (${s.email})`);
            console.log(`  Enrolled Courses: ${s.enrolledCourses}`);
        });

        const teachers = await User.find({ role: 'teacher' });
        console.log('\n--- TEACHERS ---');
        teachers.forEach(t => {
            console.log(`Teacher: ${t.name} (${t.email}) ID: ${t._id}`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
