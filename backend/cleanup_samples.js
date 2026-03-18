const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const Course = require('./src/models/Course');

const sampleNames = [
    "Dr. Sarah Wilson",
    "Prof. Michael Chen",
    "Ms. Emily Brown",
    "Mr. David Lee",
    "Sample Teacher"
];

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for cleanup');

        const result = await Course.updateMany(
            { teacher: { $in: sampleNames } },
            { $set: { teacher: "Unassigned" }, $unset: { teacherId: "" } }
        );

        console.log(`Successfully updated ${result.modifiedCount} courses.`);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

cleanup();
