const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const Course = require('./src/models/Course');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const count = await Course.countDocuments();
        fs.writeFileSync('count.txt', `Count: ${count}`);
        console.log(`Current courses count: ${count}`);
        process.exit(0);
    })
    .catch(err => {
        fs.writeFileSync('count.txt', `Error: ${err.message}`);
        console.error(err);
        process.exit(1);
    });
