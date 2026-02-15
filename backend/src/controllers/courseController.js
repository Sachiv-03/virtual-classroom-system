const Course = require('../models/Course');


// Get all courses
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a single course by ID
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new course (for admin/teacher use or seeding)
exports.createCourse = async (req, res) => {
    const course = new Course({
        title: req.body.title,
        description: req.body.description,
        teacher: req.body.teacher,
        category: req.body.category,
        thumbnail: req.body.thumbnail,
        rating: req.body.rating,
        enrolledStudents: req.body.enrolledStudents,
        lessonsCount: req.body.lessonsCount,
        units: req.body.units,
        price: req.body.price
    });

    try {
        const newCourse = await course.save();
        res.status(201).json(newCourse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update a course
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (req.body.title != null) {
            course.title = req.body.title;
        }
        if (req.body.description != null) {
            course.description = req.body.description;
        }
        if (req.body.teacher != null) {
            course.teacher = req.body.teacher;
        }
        if (req.body.category != null) {
            course.category = req.body.category;
        }

        const updatedCourse = await course.save();
        res.json(updatedCourse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        await course.remove();
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
