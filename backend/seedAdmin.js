const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Check if admin already exists
        let adminUser = await User.findOne({ email: 'admin@example.com' });

        if (!adminUser) {
            adminUser = await User.create({
                name: 'System Admin',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin'
            });
            console.log('Admin user created successfully!');
        } else {
            // Update role just in case
            adminUser.role = 'admin';
            adminUser.password = 'password123'; // reset password to default
            await adminUser.save();
            console.log('Admin user already exists. Password reset to default.');
        }

        console.log('Email: admin@example.com');
        console.log('Password: password123');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
