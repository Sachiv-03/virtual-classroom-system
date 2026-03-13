const { check, validationResult } = require('express-validator');

exports.validateAttendance = [
    check('courseId', 'Course ID is required').not().isEmpty(),
    check('courseId', 'Invalid Course ID').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

exports.validateCourseIdParam = [
    check('courseId', 'Invalid Course ID').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

exports.validateRegister = [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

exports.validateLogin = [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

exports.validateCourse = [
    check('title', 'Course title is required').not().isEmpty().trim(),
    check('category').optional().trim(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

exports.validateAssignment = [
    check('title', 'Assignment title is required').not().isEmpty().trim(),
    check('dueDate', 'Due date is required').not().isEmpty(),
    check('maxMarks', 'Max marks must be a positive number').optional().isFloat({ min: 0 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

exports.validateSchedule = [
    check('day', 'Day is required').not().isEmpty(),
    check('startTime', 'Start time is required').not().isEmpty(),
    check('endTime', 'End time is required').not().isEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];
