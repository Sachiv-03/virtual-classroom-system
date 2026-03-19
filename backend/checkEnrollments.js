const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb://127.0.0.1:27017/virtual_classroom');
    const User = require('./src/models/User');
    
    // The course in the screenshot is "cyberseccurity". Let's assume its ID is '69ae84725fe55be1bb2bcfbf'
    const courseId = '69ae84725fe55be1bb2bcfbf'; 
    console.log("Looking for students with courseId:", courseId);
    
    // Find how Mongoose resolves it
    const studentsMongooseString = await User.find({ enrolledCourses: courseId });
    console.log("mongoose find (String):", studentsMongooseString.length);

    const studentsMongooseObjectId = await User.find({ enrolledCourses: new mongoose.Types.ObjectId(courseId) });
    console.log("mongoose find (ObjectId):", studentsMongooseObjectId.length);

    const studentsRawObjectId = await mongoose.connection.db.collection('users').find({ enrolledCourses: new mongoose.Types.ObjectId(courseId) }).toArray();
    console.log("raw find (ObjectId):", studentsRawObjectId.length);

    const studentsRawString = await mongoose.connection.db.collection('users').find({ enrolledCourses: courseId }).toArray();
    console.log("raw find (String):", studentsRawString.length);

    process.exit(0);
}
check();
