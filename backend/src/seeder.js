const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Clear existing users
        await User.deleteMany();

        // Create a student
        await User.create({
            name: 'John Student',
            email: 'student@example.com',
            password: 'password123',
            role: 'student'
        });

        // Create a teacher
        await User.create({
            name: 'Dr. Sarah Teacher',
            email: 'teacher@example.com',
            password: 'password123',
            role: 'teacher'
        });

        console.log('Data Seeded Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedData();
