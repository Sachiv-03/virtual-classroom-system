const Subject = require('../models/Subject');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

exports.getAllSubjects = asyncHandler(async (req, res, next) => {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: subjects.length,
        data: subjects
    });
});

exports.getSubjectById = asyncHandler(async (req, res, next) => {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
        return next(new ErrorResponse(`Subject not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
        success: true,
        data: subject
    });
});

exports.createSubject = asyncHandler(async (req, res, next) => {
    const subject = await Subject.create(req.body);
    res.status(201).json({
        success: true,
        data: subject
    });
});

// Seed controller function handles calling the script logic directly or generating data itself
exports.seedSyllabus = asyncHandler(async (req, res, next) => {
    // We can also have the data array defined here or in a separate file.
    // Given the prompt asking for 10 subjects and 10 chapters, we can generate it.
    
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

    // For Data Structures specific example requested:
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

    res.status(200).json({
        success: true,
        message: `Seeded ${count} new subjects successfully.`
    });
});
