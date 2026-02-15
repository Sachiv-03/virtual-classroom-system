const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./src/models/Course');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const courses = [
    {
        title: "Full Stack Web Development",
        teacher: "Mr. David Lee",
        category: "Technology",
        thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80",
        rating: 4.8,
        enrolledStudents: 1245,
        lessonsCount: 45,
        price: 99.99,
        description: "Become a full-stack developer with this comprehensive course covering HTML, CSS, JavaScript, React, Node.js, and Databases. Build real-world projects and master the art of web development."
    },
    {
        title: "Introduction to Psychology",
        teacher: "Dr. Sarah Wilson",
        category: "Science",
        thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
        rating: 4.9,
        enrolledStudents: 856,
        lessonsCount: 38,
        price: 79.99,
        description: "Explore the human mind and behavior. This course covers the biological bases of behavior, sensation, perception, learning, memory, cognition, and psychological disorders."
    },
    {
        title: "Advanced Calculus & Real Analysis",
        teacher: "Prof. Michael Chen",
        category: "Mathematics",
        thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80",
        rating: 4.7,
        enrolledStudents: 560,
        lessonsCount: 42,
        price: 89.99,
        description: "A rigorous journey into advanced mathematics. Master multivariable calculus, vector fields, partial derivatives, and the foundations of real analysis."
    },
    {
        title: "English Literature: Classics to Contemporary",
        teacher: "Ms. Emily Brown",
        category: "Languages",
        thumbnail: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&q=80",
        rating: 4.6,
        enrolledStudents: 430,
        lessonsCount: 30,
        price: 69.99,
        description: "Dive into the world of literature. Analyze classic novels, poetry, and plays, and understand the cultural and historical contexts that shaped them."
    }
];

const generateFullStackSyllabus = () => {
    return [
        {
            title: "Chapter 1: Front-End Foundations",
            description: "Mastering the building blocks of the web.",
            order: 1,
            topics: [
                { title: "HTML5 Semantic Structure", type: "reading", content: "Understanding semantic tags like <header>, <nav>, <article>, and <section>.", duration: "10 mins" },
                { title: "CSS3 Flexbox and Grid", type: "video", content: "https://www.youtube.com/watch?v=phWxA89Dy9E", duration: "25 mins" },
                { title: "Responsive Design Principles", type: "reading", content: "Mobile-first approach, media queries, and fluid layouts.", duration: "15 mins" },
                { title: "JavaScript Basics & ES6+", type: "video", content: "https://www.youtube.com/watch?v=W6NZfCO5SIk", duration: "30 mins" },
                { title: "DOM Manipulation", type: "assignment", content: "Build a dynamic to-do list using vanilla JavaScript.", duration: "45 mins" }
            ]
        },
        {
            title: "Chapter 2: React.js Essentials",
            description: "Building modern, interactive UIs with React.",
            order: 2,
            topics: [
                { title: "Components and Props", type: "video", content: "https://www.youtube.com/watch?v=SqcY0GlETPk", duration: "20 mins" },
                { title: "State Management with Hooks", type: "reading", content: "Deep dive into useState and useEffect hooks.", duration: "15 mins" },
                { title: "React Router for Navigation", type: "video", content: "https://www.youtube.com/watch?v=UjHT_NKR_gU", duration: "25 mins" },
                { title: "Context API vs Redux", type: "reading", content: "Managing global state in large applications.", duration: "20 mins" }
            ]
        },
        {
            title: "Chapter 3: Back-End Development with Node.js",
            description: "Server-side logic and API development.",
            order: 3,
            topics: [
                { title: "Node.js Runtime & Architecture", type: "reading", content: "Event loop, non-blocking I/O, and modules.", duration: "15 mins" },
                { title: "Building REST APIs with Express", type: "video", content: "https://www.youtube.com/watch?v=pKd0Rpw7O48", duration: "35 mins" },
                { title: "Middleware & Error Handling", type: "reading", content: "Writing custom middleware for authentication and logging.", duration: "15 mins" },
                { title: "Authentication with JWT", type: "video", content: "https://www.youtube.com/watch?v=mbsmsi7l3r4", duration: "40 mins" }
            ]
        },
        {
            title: "Chapter 4: Databases & Deployment",
            description: "Data persistence and going live.",
            order: 4,
            topics: [
                { title: "MongoDB Schema Design", type: "video", content: "https://www.youtube.com/watch?v=DZBGEVgL2eE", duration: "30 mins" },
                { title: "Mongoose ODM", type: "reading", content: "Defining models and performing CRUD operations.", duration: "20 mins" },
                { title: "Git & Version Control", type: "video", content: "https://www.youtube.com/watch?v=RGOj5yH7evk", duration: "25 mins" },
                { title: "Deployment to Vercel/Render", type: "assignment", content: "Deploy your full-stack MERN application.", duration: "60 mins" }
            ]
        }
    ];
};

const generatePsychologySyllabus = () => {
    return [
        {
            title: "Chapter 1: The Science of Psychology",
            description: "Introduction to research methods and history.",
            order: 1,
            topics: [
                { title: "History and Approaches", type: "reading", content: "Structuralism, Functionalism, Psychoanalysis, and Behaviorism.", duration: "15 mins" },
                { title: "Research Methods", type: "video", content: "https://www.youtube.com/watch?v=hFV71QPvX2I", duration: "20 mins" },
                { title: "Ethical Guidelines", type: "reading", content: "APA guidelines for human and animal research.", duration: "10 mins" }
            ]
        },
        {
            title: "Chapter 2: Biological Bases of Behavior",
            description: "The link between biology and psychology.",
            order: 2,
            topics: [
                { title: "The Neuron and Action Potential", type: "video", content: "https://www.youtube.com/watch?v=H7hN-m5st2k", duration: "25 mins" },
                { title: "Brain Structures & Functions", type: "reading", content: "The roles of the hindbrain, midbrain, and forebrain.", duration: "20 mins" },
                { title: "The Endocrine System", type: "video", content: "https://www.youtube.com/watch?v=HXPCQUW_wm0", duration: "15 mins" }
            ]
        },
        {
            title: "Chapter 3: Sensation & Perception",
            description: "How we experience the world.",
            order: 3,
            topics: [
                { title: "Visual Processing", type: "reading", content: "From the eye to the visual cortex.", duration: "15 mins" },
                { title: "Theories of Color Vision", type: "video", content: "https://www.youtube.com/watch?v=l8_fZPHasdo", duration: "20 mins" },
                { title: "Perceptual Organization", type: "assignment", content: "Identify Gestalt principles in everyday images.", duration: "30 mins" }
            ]
        }
    ];
};

const generateCalculusSyllabus = () => {
    return [
        {
            title: "Chapter 1: Functions of Several Variables",
            description: "Extending calculus to higher dimensions.",
            order: 1,
            topics: [
                { title: "Vectors in 3D Space", type: "reading", content: "Dot product, cross product, and lines/planes.", duration: "20 mins" },
                { title: "Surfaces and Level Curves", type: "video", content: "https://www.youtube.com/watch?v=t-0t12k5z-g", duration: "30 mins" },
                { title: "Limits and Continuity", type: "reading", content: "Epsilon-delta definitions in multivariable context.", duration: "25 mins" }
            ]
        },
        {
            title: "Chapter 2: Partial Derivatives",
            description: "Rates of change in multiple directions.",
            order: 2,
            topics: [
                { title: "Computing Partial Derivatives", type: "video", content: "https://www.youtube.com/watch?v=SPrSh98j2Cg", duration: "25 mins" },
                { title: "The Gradient Vector", type: "reading", content: "Direction of steepest ascent and normal vectors.", duration: "20 mins" },
                { title: "Lagrange Multipliers", type: "assignment", content: "Solve optimization problems with constraints.", duration: "45 mins" }
            ]
        }
    ];
};

const generateLiteratureSyllabus = () => {
    return [
        {
            title: "Chapter 1: Foundations of Literary Analysis",
            description: "Tools for critical reading.",
            order: 1,
            topics: [
                { title: "Theme, Symbol, and Motif", type: "reading", content: "Distinguishing between core literary elements.", duration: "15 mins" },
                { title: "Narrative Structure", type: "video", content: "https://www.youtube.com/watch?v=p4q88X2s0_E", duration: "20 mins" },
            ]
        }
    ];
};

const importData = async () => {
    try {
        await Course.deleteMany();

        const data = [
            { ...courses[0], syllabus: generateFullStackSyllabus() },
            { ...courses[1], syllabus: generatePsychologySyllabus() },
            { ...courses[2], syllabus: generateCalculusSyllabus() },
            { ...courses[3], syllabus: generateLiteratureSyllabus() }
        ];

        await Course.insertMany(data);

        console.log('Real Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
