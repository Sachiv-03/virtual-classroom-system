const Course = require('../models/Course');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Get all courses
exports.getAllCourses = asyncHandler(async (req, res, next) => {
    if (res.advancedResults) {
        return res.status(200).json(res.advancedResults);
    } else {
        const courses = await Course.find();
        return res.json(courses);
    }
});

// Get a single course by ID
exports.getCourseById = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
    }
    res.json(course);
});

// Create a new course
exports.createCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.create(req.body);
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
