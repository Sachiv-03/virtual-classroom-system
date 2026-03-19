const axios = require('axios');
const jwt = require('jsonwebtoken');

async function test() {
    require('dotenv').config();
    try {
        const mongoose = require('mongoose');
        await mongoose.connect('mongodb://127.0.0.1:27017/virtual_classroom');
        const User = require('./src/models/User');
        const Course = require('./src/models/Course');
        
        const courseId = '69ae84725fe55be1bb2bcfbf';
        const course = await Course.findById(courseId);
        const teacher = await User.findById(course.teacherId);
        
        console.log("Teacher email:", teacher.email, 'Id:', teacher._id);
        
        // create token
        const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });
        console.log("Token:", token);
        
        const studentsRes = await axios.get(`http://localhost:5000/api/courses/${courseId}/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(JSON.stringify(studentsRes.data, null, 2));
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
    process.exit(0);
}
test();
