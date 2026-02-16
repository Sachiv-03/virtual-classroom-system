const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Helper to wrap async functions because Express 4 doesn't support async/await natively in routes
// No need for a separate error handler middleware here if we just handle the promise but for safety:
const asyncMiddleware = fn =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };

router.get('/', asyncMiddleware(courseController.getAllCourses));
router.get('/:id', asyncMiddleware(courseController.getCourseById));
router.post('/', asyncMiddleware(courseController.createCourse));
router.put('/:id', asyncMiddleware(courseController.updateCourse));
router.delete('/:id', asyncMiddleware(courseController.deleteCourse));
router.post('/:id/schedule', asyncMiddleware(courseController.addSchedule));

module.exports = router;
