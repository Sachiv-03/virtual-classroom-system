const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const recreateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Delete any existing admin user with this email
        await User.deleteOne({ email: 'admin@example.com' });

        // Re-create it
        await User.create({
            name: 'System Admin',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin'
        });

        console.log('Admin user forcefully recreated successfully!');
        console.log('Email: admin@example.com');
        console.log('Password: password123');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

recreateAdmin();
