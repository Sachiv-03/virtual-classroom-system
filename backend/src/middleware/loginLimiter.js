let loginLimiter;

try {
    const rateLimit = require('express-rate-limit');
    loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 login requests per windowMs
        message: {
            success: false,
            message: "Too many login attempts from this IP, please try again after 15 minutes"
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
} catch (error) {
    console.warn("Warning: express-rate-limit not found. Login rate limiting is disabled.");
    // Fallback middleware that effectively does nothing
    loginLimiter = (req, res, next) => next();
}

module.exports = loginLimiter;
