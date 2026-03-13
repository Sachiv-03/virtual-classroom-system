const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Rate limiter for marking attendance
// Uses user ID as key (not IP) so different users at same IP aren't blocked together
const attendanceLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minute window
    max: 3, // Allow up to 3 requests per 5 minutes per user
    keyGenerator: (req) => {
        // Try to extract user ID from JWT token for per-user rate limiting
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // Key by userId + courseId body param so each course is tracked separately
                const courseId = req.body?.courseId || 'unknown';
                return `attendance_${decoded.id}_${courseId}`;
            }
        } catch (e) { /* fall through to IP */ }
        return req.ip;
    },
    message: {
        success: false,
        message: 'You have already marked attendance recently. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});

module.exports = attendanceLimiter;
