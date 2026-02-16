const rateLimit = require('express-rate-limit');

// Rate limiter for marking attendance
const attendanceLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 1, // Start blocking after 1 request
    message: {
        success: false,
        message: 'You have already marked attendance recently. Please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = attendanceLimiter;
