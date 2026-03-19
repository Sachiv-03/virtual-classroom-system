const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const UserProgress = require('./src/models/UserProgress');

dotenv.config();

const resetEnrollments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // 1. Clear enrolledCourses for all students
        const resUser = await User.updateMany(
            { role: 'student' },
            { $set: { enrolledCourses: [] } }
        );
        console.log(`Cleared enrolledCourses for ${resUser.modifiedCount} students.`);

        // 2. Clear enrolledStudents count on all courses
        const resCourse = await Course.updateMany(
            {},
            { $set: { enrolledStudents: 0 } }
        );
        console.log(`Reset enrolledStudents count to 0 for ${resCourse.modifiedCount} courses.`);

        // 3. Optional: Clear UserProgress
        const resProgress = await UserProgress.deleteMany({});
        console.log(`Deleted ${resProgress.deletedCount} progress records.`);

        console.log('Enrollment reset complete!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

resetEnrollments();
