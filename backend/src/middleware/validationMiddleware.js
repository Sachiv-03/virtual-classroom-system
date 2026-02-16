const { check, validationResult } = require('express-validator');

exports.validateAttendance = [
    check('courseId', 'Course ID is required').not().isEmpty(),
    check('courseId', 'Invalid Course ID').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

exports.validateCourseIdParam = [
    check('courseId', 'Invalid Course ID').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
