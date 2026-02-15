const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const Assignment = require('./backend/src/models/Assignment');
const User = require('./backend/src/models/User');

const assignmentsToSeed = [
    {
        title: "Introduction to Quantum Computing",
        description: "Research the basic principles of qubits, superposition, and entanglement. Write a summary of how they differ from classical bits.",
        subject: "Physics",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxMarks: 100,
        courseId: "PHY302"
    },
    {
        title: "Modern Architecture Trends 2024",
        description: "Analyze the shift towards sustainable materials in urban architecture. Focus on 3 major skyscrapers built in the last 2 years.",
        subject: "Architecture",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        maxMarks: 50,
        courseId: "ARC101"
    },
    {
        title: "Neural Networks from Scratch",
        description: "Implement a simple perceptron and a multi-layer perceptron using only NumPy. Test it on the MNIST dataset.",
        subject: "Computer Science",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        maxMarks: 100,
        courseId: "CS503"
    },
    {
        title: "The Great Depression: Economic Impact",
        description: "Discuss the global economic consequences of the Great Depression and the subsequent recovery strategies.",
        subject: "History",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        maxMarks: 75,
        courseId: "HIS201"
    },
    {
        title: "Organic Chemistry: Synthesis Lab",
        description: "Propose a synthesis route for Aspirin starting from Benzene. Include all reagents and mechanisms.",
        subject: "Chemistry",
        dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        maxMarks: 100,
        courseId: "CHM401"
    },
    {
        title: "Macroeconomics: Inflation vs Unemployment",
        description: "Examine the Phillips Curve in the context of recent global inflation spikes. Use real-world data from 2021-2023.",
        subject: "Economics",
        dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        maxMarks: 80,
        courseId: "ECO202"
    },
    {
        title: "Philosophy of Artificial Intelligence",
        description: "Can a machine truly think? Explore the Turing Test and the Chinese Room argument in a 1000-word essay.",
        subject: "Philosophy",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        maxMarks: 100,
        courseId: "PHL105"
    }
];

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const teacher = await User.findOne({ role: 'teacher' });
        if (!teacher) {
            console.error('No teacher found. Please register at least one teacher.');
            process.exit(1);
        }

        console.log(`Targeting teacher: ${teacher.name} (${teacher.email})`);

        // Clean up previous seeds if any
        // await Assignment.deleteMany({ teacherId: teacher._id });

        const assignmentsWithTeacher = assignmentsToSeed.map(a => ({
            ...a,
            teacherId: teacher._id
        }));

        const result = await Assignment.insertMany(assignmentsWithTeacher);
        console.log(`Successfully seeded ${result.length} assignments.`);

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
