const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Subject = require('../src/models/Subject');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedSyllabus = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected for seeding syllabus...');

        const subjectNames = [
            "Computer Science",
            "Data Structures",
            "Operating Systems",
            "Database Management Systems",
            "Computer Networks",
            "Software Engineering",
            "Artificial Intelligence",
            "Machine Learning",
            "Cyber Security",
            "Cloud Computing"
        ];
    
        const dsChapters = [
            "Introduction to Data Structures",
            "Arrays",
            "Linked Lists",
            "Stacks",
            "Queues",
            "Trees",
            "Binary Search Trees",
            "Graphs",
            "Hash Tables",
            "Advanced Data Structures"
        ];

        const chaptersTemplate = [
            "Introduction to ",
            "Basics of ",
            "Advanced Concepts in ",
            "Applications of ",
            "Modern Trends in ",
            "Algorithms for ",
            "Case Studies in ",
            "Project Work on ",
            "Deep Dive into ",
            "Future of "
        ];

        let count = 0;
        for (const name of subjectNames) {
            const existing = await Subject.findOne({ name });
            if (!existing) {
                let chapters = [];
                for (let i = 0; i < 10; i++) {
                    let chapterTitle = name === "Data Structures" ? dsChapters[i] : `${chaptersTemplate[i]}${name}`;
                    chapters.push({
                        title: chapterTitle,
                        content: `Comprehensive content overview covering ${chapterTitle}.`,
                        resources: [
                            { type: "pdf", title: "Lecture Notes", link: "https://example.com/notes.pdf" },
                            { type: "video", title: "Lecture Video", link: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
                            { type: "article", title: "Further Reading", link: "https://example.com/reading" }
                        ]
                    });
                }
    
                await Subject.create({
                    name,
                    description: `Complete university syllabus for ${name}`,
                    chapters
                });
                count++;
            }
        }
        
        console.log(`Seeded ${count} subjects successfully!`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedSyllabus();
