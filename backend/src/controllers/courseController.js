const Course = require('../models/Course');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Get all courses
exports.getAllCourses = asyncHandler(async (req, res, next) => {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    const processCourses = (coursesArr) => {
        return coursesArr.map(course => {
            const courseObj = course.toObject ? course.toObject() : course;
            courseObj.isEnrolled = false;

            if (user.role === 'teacher' || user.role === 'admin') {
                courseObj.isEnrolled = true;
            } else if (user.enrolledCourses && user.enrolledCourses.includes(courseObj._id.toString())) {
                courseObj.isEnrolled = true;
            }
            return courseObj;
        });
    };

    if (res.advancedResults) {
        res.advancedResults.data = processCourses(res.advancedResults.data);
        return res.status(200).json(res.advancedResults);
    } else {
        const courses = await Course.find();
        return res.json({ success: true, count: courses.length, data: processCourses(courses) });
    }
});

// Attach parsed syllabus to a course
exports.attachSyllabus = asyncHandler(async (req, res, next) => {
    const { syllabusId } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
    }

    // Only allow admin or the original teacher to attach syllabus
    if (req.user.role !== 'admin' && course.teacherId && course.teacherId.toString() !== req.user.id) {
        return next(new ErrorResponse(`Not authorized to update this course`, 403));
    }

    const Syllabus = require('../models/Syllabus');
    const syllabus = await Syllabus.findById(syllabusId);

    if (!syllabus) {
        return next(new ErrorResponse(`Syllabus not found`, 404));
    }

    // Map syllabus units to course units schema
    const newUnits = syllabus.units.map((unit, uIdx) => ({
        id: `u${uIdx + 1}`,
        title: unit.unitTitle || `Unit ${uIdx + 1}`,
        topics: unit.topics.map((topicStr, tIdx) => ({
            id: `t${uIdx + 1}.${tIdx + 1}`,
            title: topicStr,
            duration: "Self-paced",
            materials: [],
            completed: false
        }))
    }));

    course.units = newUnits;
    course.description = syllabus.description || course.description;

    // Also increment lessons count based on total topics
    course.lessonsCount = newUnits.reduce((acc, unit) => acc + unit.topics.length, 0);

    await course.save();

    res.status(200).json({
        success: true,
        data: course
    });
});

// Get a single course by ID
exports.getCourseById = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
    }
    res.json(course);
});

// Check if user is enrolled
exports.checkEnrollmentStatus = asyncHandler(async (req, res, next) => {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }
    const isEnrolled = user.enrolledCourses && user.enrolledCourses.includes(req.params.id);
    res.json({ isEnrolled: !!isEnrolled });
});

// Create a new course
exports.createCourse = asyncHandler(async (req, res, next) => {
    const courseData = { ...req.body, teacherId: req.user.id };
    // If frontend didn't pass a teacher name, grab it from user (mocking it for backwards compatibility if needed)
    if (!courseData.teacher && req.user.name) {
        courseData.teacher = req.user.name;
    }
    const course = await Course.create(courseData);
    res.status(201).json(course);
});

// Update a course
exports.updateCourse = asyncHandler(async (req, res, next) => {
    let course = await Course.findById(req.params.id);

    if (!course) {
        return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.json(course);
});

// Delete a course
exports.deleteCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
    }

    await course.deleteOne();
    res.json({ message: 'Course deleted' });
});
const googleMeet = require('../utils/googleMeet');
const n8nService = require('../services/n8nService');

// Add schedule to a course
exports.addSchedule = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
    }

    const { day, startTime, endTime, room } = req.body;

    // --- 1. Programmatically trigger Google Meet link generation ---
    let meetLink = '';
    try {
        // We use the ID of the user currently making the request (teacher)
        // to fetch their OAuth tokens and create the event.
        meetLink = await googleMeet.createMeetLink({
            title: course.title,
            startTime,
            endTime,
            date: req.body.date // Option to provide a specific date, otherwise utility defaults to today
        }, req.user.id);

        console.log(`Generated Meet Link: ${meetLink}`);
    } catch (error) {
        console.warn('Could not generate Meet link automatically:', error.message);
        // We can choose to fail the request or continue with an empty link
    }

    // --- 2. Store the Meet link in MongoDB along with class details ---
    const newScheduleSlot = {
        day,
        startTime,
        endTime,
        room: room || 'Online',
        meetLink
    };

    course.schedule.push(newScheduleSlot);

    await course.save();

    // --- 3. Trigger n8n Webhook for automation ---
    // This will allow you to automate Slack notifications, Emails, etc.
    n8nService.triggerWebhook('CLASS_SCHEDULED', {
        courseId: course._id,
        courseTitle: course.title,
        teacher: course.teacher,
        schedule: newScheduleSlot
    });

    res.status(201).json(course);
});

// --- Syllabus Builder Methods ---

// @desc Add a Unit to a Course
// @route POST /api/courses/:id/units
exports.addUnit = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);
    if (!course) return next(new ErrorResponse(`Course not found`, 404));
    
    // Auth check
    if (req.user.role !== 'admin' && course.teacherId && course.teacherId.toString() !== req.user.id) {
        return next(new ErrorResponse(`Not authorized to update this course`, 403));
    }

    const newUnit = {
        id: `u${Date.now()}`,
        title: req.body.title || "New Unit",
        topics: []
    };

    course.units.push(newUnit);
    await course.save();
    res.status(200).json({ success: true, data: course });
});

// @desc Update a Unit
// @route PUT /api/courses/:id/units/:unitId
exports.updateUnit = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);
    if (!course) return next(new ErrorResponse(`Course not found`, 404));

    if (req.user.role !== 'admin' && course.teacherId && course.teacherId.toString() !== req.user.id) {
        return next(new ErrorResponse(`Not authorized to update this course`, 403));
    }

    const unit = course.units.id(req.params.unitId) || course.units.find(u => u.id === req.params.unitId || u._id.toString() === req.params.unitId);
    if (!unit) return next(new ErrorResponse(`Unit not found`, 404));

    if (req.body.title) unit.title = req.body.title;

    await course.save();
    res.status(200).json({ success: true, data: course });
});

// @desc Delete a Unit
// @route DELETE /api/courses/:id/units/:unitId
exports.deleteUnit = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);
    if (!course) return next(new ErrorResponse(`Course not found`, 404));

    if (req.user.role !== 'admin' && course.teacherId && course.teacherId.toString() !== req.user.id) {
        return next(new ErrorResponse(`Not authorized to update this course`, 403));
    }

    const unitIndex = course.units.findIndex(u => u.id === req.params.unitId || u._id.toString() === req.params.unitId);
    if (unitIndex === -1) return next(new ErrorResponse(`Unit not found`, 404));

    // Remove topics count from lessonsCount
    const topicsCount = course.units[unitIndex].topics.length;
    course.lessonsCount = Math.max(0, course.lessonsCount - topicsCount);

    course.units.splice(unitIndex, 1);
    await course.save();
    res.status(200).json({ success: true, data: course });
});

// @desc Add a Topic to a Unit
// @route POST /api/courses/:id/units/:unitId/topics
exports.addTopic = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);
    if (!course) return next(new ErrorResponse(`Course not found`, 404));

    if (req.user.role !== 'admin' && course.teacherId && course.teacherId.toString() !== req.user.id) {
        return next(new ErrorResponse(`Not authorized to update this course`, 403));
    }

    const unit = course.units.id(req.params.unitId) || course.units.find(u => u.id === req.params.unitId || u._id.toString() === req.params.unitId);
    if (!unit) return next(new ErrorResponse(`Unit not found`, 404));

    const newTopic = {
        id: `t${Date.now()}`,
        title: req.body.title || "New Topic",
        duration: req.body.duration || "0:00",
        videoUrl: req.body.videoUrl || "",
        materials: req.body.materials || [],
        completed: false
    };

    unit.topics.push(newTopic);
    course.lessonsCount += 1;
    
    await course.save();
    res.status(200).json({ success: true, data: course });
});
