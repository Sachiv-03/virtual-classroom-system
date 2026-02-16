const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');

dotenv.config();

const courses = [
    {
        title: "Advanced Mathematics",
        teacher: "Dr. Sarah Wilson",
        category: "Mathematics",
        thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60",
        rating: 4.8,
        description: "Deep dive into calculus and linear algebra.",
        lessonsCount: 24,
        enrolledStudents: 156,
        schedule: [
            { day: "Monday", startTime: "09:00", endTime: "10:30", room: "Room 101" },
            { day: "Wednesday", startTime: "09:00", endTime: "10:30", room: "Room 101" }
        ]
    },
    {
        title: "Physics 101",
        teacher: "Prof. Michael Chen",
        category: "Science",
        thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=60",
        rating: 4.6,
        description: "Introduction to mechanics and thermodynamics.",
        lessonsCount: 18,
        enrolledStudents: 120,
        schedule: [
            { day: "Tuesday", startTime: "11:00", endTime: "12:30", room: "Lab A" },
            { day: "Thursday", startTime: "11:00", endTime: "12:30", room: "Lab A" }
        ]
    },
    {
        title: "English Literature",
        teacher: "Ms. Emily Brown",
        category: "Arts",
        thumbnail: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=60",
        rating: 4.9,
        description: "Study of classic and modern literature.",
        lessonsCount: 15,
        enrolledStudents: 98,
        schedule: [
            { day: "Monday", startTime: "14:00", endTime: "15:30", room: "Room 204" },
            { day: "Friday", startTime: "10:00", endTime: "11:30", room: "Room 204" }
        ]
    },
    {
        title: "Computer Science",
        teacher: "Mr. David Lee",
        category: "Technology",
        thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60",
        rating: 4.7,
        description: "Fundamentals of programming and algorithms.",
        lessonsCount: 30,
        enrolledStudents: 200,
        schedule: [
            { day: "Wednesday", startTime: "16:00", endTime: "17:30", room: "Online" },
            { day: "Friday", startTime: "14:00", endTime: "15:30", room: "Online" }
        ]
    }
];

const seedCourses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);

        await Course.deleteMany(); // Clear existing courses
        await Course.insertMany(courses); // Insert new courses with schedule

        console.log('Courses seeded successfully');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedCourses();
