const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');

dotenv.config();

const getUsers = async () => {
    try {
        await connectDB();
        const users = await User.find({}).select('name email role');
        console.log("Users in Database:");
        users.forEach(u => console.log(`- Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

getUsers();
