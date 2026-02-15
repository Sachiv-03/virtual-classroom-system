const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./src/models/Course');

dotenv.config();

console.log("Starting seeder...");
console.log("URI:", process.env.MONGO_URI ? "Found" : "Missing");

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
    seed();
}).catch(err => {
    console.error("Connection Error:", err);
    process.exit(1);
});

const syllabusDetails = {
    "18.06": {
        title: "Matrix Theory and Linear Algebra",
        teacher: "Prof. Gilbert Strang",
        category: "Mathematics",
        thumbnail: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/18-06s10.jpg",
        rating: 4.9,
        enrolledStudents: 15420,
        lessonsCount: 35,
        price: 0,
        description: "This course covers matrix theory and linear algebra, emphasizing topics useful in other disciplines such as physics, economics and social sciences, natural sciences, and engineering. It parallels the combination of theory and applications in Professor Strang's textbook Introduction to Linear Algebra.",
        units: [
            {
                id: "u1",
                title: "Chapter 1: The Geometry of Linear Equations",
                topics: [
                    {
                        id: "t1.1",
                        title: "Lecture 1: The Geometry of Linear Equations",
                        duration: "39 mins",
                        videoUrl: "https://www.youtube.com/embed/ZK3O402wf1c",
                        materials: [
                            { name: "Lecture Summary", type: "pdf", size: "150 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/mit18_06s10_l01/" },
                            { name: "Problem Set 1", type: "pdf", size: "200 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/assignments/ps1/" }
                        ],
                        completed: false
                    },
                    {
                        id: "t1.2",
                        title: "Recitation 1: Geometry of Linear Algebra",
                        duration: "20 mins",
                        videoUrl: "https://www.youtube.com/embed/QGk7bCg4X1k",
                        materials: [],
                        completed: false
                    }
                ]
            },
            {
                id: "u2",
                title: "Chapter 2: Elimination with Matrices",
                topics: [
                    {
                        id: "t2.1",
                        title: "Lecture 2: Elimination with Matrices",
                        duration: "47 mins",
                        videoUrl: "https://www.youtube.com/embed/QVKj3LADCnA",
                        materials: [
                            { name: "Lecture Summary", type: "pdf", size: "145 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/mit18_06s10_l02/" }
                        ],
                        completed: false
                    }
                ]
            },
            {
                id: "u3",
                title: "Chapter 3: Multiplication and Inverse Matrices",
                topics: [
                    {
                        id: "t3.1",
                        title: "Lecture 3: Multiplication and Inverse Matrices",
                        duration: "46 mins",
                        videoUrl: "https://www.youtube.com/embed/FX4C-JpTFgY",
                        materials: [
                            { name: "Lecture Summary", type: "pdf", size: "140 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/mit18_06s10_l03/" }
                        ],
                        completed: false
                    }
                ]
            },
            {
                id: "u4",
                title: "Chapter 4: Factorization into A = LU",
                topics: [
                    {
                        id: "t4.1",
                        title: "Lecture 4: Factorization into A = LU",
                        duration: "48 mins",
                        videoUrl: "https://www.youtube.com/embed/5hSfajMqkbg",
                        materials: [
                            { name: "Lecture Summary", type: "pdf", size: "135 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/mit18_06s10_l04/" },
                            { name: "Problem Set 2", type: "pdf", size: "210 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/assignments/ps2/" }
                        ],
                        completed: false
                    }
                ]
            },
            {
                id: "u5",
                title: "Chapter 5: Transposes, Permutations, Vector Spaces",
                topics: [
                    {
                        id: "t5.1",
                        title: "Lecture 5: Transposes, Permutations, Vector Spaces R^n",
                        duration: "47 mins",
                        videoUrl: "https://www.youtube.com/embed/J7DzL2_Na80",
                        materials: [
                            { name: "Lecture Summary", type: "pdf", size: "142 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/mit18_06s10_l05/" }
                        ],
                        completed: false
                    }
                ]
            },
            {
                id: "u6",
                title: "Chapter 6: Column Space and Nullspace",
                topics: [
                    {
                        id: "t6.1",
                        title: "Lecture 6: Column Space and Nullspace",
                        duration: "45 mins",
                        videoUrl: "https://www.youtube.com/embed/8o5Cmfpeo6g",
                        materials: [
                            { name: "Lecture Summary", type: "pdf", size: "138 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/mit18_06s10_l06/" }
                        ],
                        completed: false
                    }
                ]
            },
            {
                id: "u7",
                title: "Chapter 7: Solving Ax = 0",
                topics: [
                    {
                        id: "t7.1",
                        title: "Lecture 7: Solving Ax = 0: Pivot Variables, Special Solutions",
                        duration: "49 mins",
                        videoUrl: "https://www.youtube.com/embed/VqP_ACJTE_w",
                        materials: [
                            { name: "Lecture Summary", type: "pdf", size: "148 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/mit18_06s10_l07/" },
                            { name: "Problem Set 3", type: "pdf", size: "215 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/assignments/ps3/" }
                        ],
                        completed: false
                    }
                ]
            },
            {
                id: "u8",
                title: "Chapter 8: Solving Ax = b",
                topics: [
                    {
                        id: "t8.1",
                        title: "Lecture 8: Solving Ax = b: Row Reduced Form R",
                        duration: "47 mins",
                        videoUrl: "https://www.youtube.com/embed/9QJKn0vE4e0",
                        materials: [
                            { name: "Lecture Summary", type: "pdf", size: "139 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/mit18_06s10_l08/" }
                        ],
                        completed: false
                    }
                ]
            },
            {
                id: "u9",
                title: "Chapter 9: Independence, Basis, and Dimension",
                topics: [
                    {
                        id: "t9.1",
                        title: "Lecture 9: Independence, Basis, and Dimension",
                        duration: "50 mins",
                        videoUrl: "https://www.youtube.com/embed/_Rjkj3zO7Z8",
                        materials: [
                            { name: "Lecture Summary", type: "pdf", size: "141 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/mit18_06s10_l09/" }
                        ],
                        completed: false
                    }
                ]
            },
            {
                id: "u10",
                title: "Chapter 10: The four fundamental subspaces",
                topics: [
                    {
                        id: "t10.1",
                        title: "Lecture 10: The Four Fundamental Subspaces",
                        duration: "49 mins",
                        videoUrl: "https://www.youtube.com/embed/nHlE7EgJFds",
                        materials: [
                            { name: "Lecture Summary", type: "pdf", size: "144 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/mit18_06s10_l10/" },
                            { name: "Exam 1 Review", type: "pdf", size: "300 KB", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/exams/exam1/" }
                        ],
                        completed: false
                    }
                ]
            }
        ]
    }
};

const seed = async () => {
    try {
        await Course.deleteMany({});
        console.log("Cleared existing courses");

        const courseData = syllabusDetails["18.06"];
        await Course.create(courseData);

        console.log('MIT OCW Course Data Imported!');
        process.exit(0);
    } catch (error) {
        console.error("Seed Error:", error);
        process.exit(1);
    }
};
