const mongoose = require('mongoose');
const User = require('./src/models/User');
const Course = require('./src/models/Course');

mongoose.connect('mongodb://127.0.0.1:27017/virtual-classroom')
  .then(async () => {
    try {
      const u = await User.findOne({role: 'teacher'});
      if (!u) throw new Error("No teacher found");
      console.log('Teacher:', u.email, u._id);
      
      const c = await Course.findOne({teacherId: u._id});
      if (!c) throw new Error("No course found for teacher");
      console.log('Course:', c._id, c.title);
      
      // Test adding a unit
      c.units.push({
          id: `u${Date.now()}`,
          title: "Test Verification Unit",
          topics: [{
              id: `t${Date.now()}`,
              title: "Test Topic",
              duration: "10:00",
              videoUrl: "https://youtube.com",
              materials: [],
              completed: false
          }]
      });
      c.lessonsCount += 1;
      await c.save();
      
      console.log('Successfully saved unit and topic to course!');
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });
