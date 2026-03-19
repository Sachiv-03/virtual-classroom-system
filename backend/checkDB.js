const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb://127.0.0.1:27017/virtual_classroom');
    const Course = require('./src/models/Course');
    const User = require('./src/models/User');

    const course = await Course.findOne({ title: { $regex: /cyberseccurity/i } });
    if (!course) {
        console.log("Course not found");
        process.exit(0);
    }
    console.log("Course found:", course._id, course.title, course.enrolledStudents);

    const students = await User.find({
        role: 'student',
        enrolledCourses: course._id
    });
    console.log("Students enrolled in this course:", students.length);
    students.forEach(s => console.log(s.name, s.email, s.enrolledCourses));

    process.exit(0);
}
check();
