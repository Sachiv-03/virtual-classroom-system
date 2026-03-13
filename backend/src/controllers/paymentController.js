const Razorpay = require('razorpay');
const crypto = require('crypto');
const Course = require('../models/Course');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret || key_id.startsWith('rzp_test_1DP5mmOl')) return null;
    return new Razorpay({ key_id, key_secret });
};

exports.createOrder = asyncHandler(async (req, res, next) => {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
        return next(new ErrorResponse('Course not found', 404));
    }

    if (course.price <= 0) {
        return next(new ErrorResponse('Course is free, directly enroll', 400));
    }

    const options = {
        amount: course.price * 100, // amount in smallest currency unit (e.g. paise)
        currency: "INR",
        receipt: `receipt_${courseId}_${req.user.id}`
    };

    try {
        const rp = getRazorpayInstance();
        if (!rp) {
            // Mock mode
            return res.status(200).json({
                success: true,
                order: { id: "order_mock_" + Date.now(), amount: options.amount, currency: options.currency },
                keyId: 'mock'
            });
        }

        const order = await rp.orders.create(options);
        res.status(200).json({
            success: true,
            order,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error("Razorpay Error:", err);
        return next(new ErrorResponse('Payment order creation failed. Please check your API Keys.', 500));
    }
});

exports.verifyPayment = asyncHandler(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;

    if (razorpay_signature === "mock_signature") {
        const user = await User.findById(req.user.id);
        const course = await Course.findById(courseId);

        if (!user.enrolledCourses) user.enrolledCourses = [];

        if (!user.enrolledCourses.some(id => id.toString() === courseId)) {
            user.enrolledCourses.push(courseId);
            await user.save();

            course.enrolledStudents += 1;
            await course.save();
        }
        return res.status(200).json({ success: true, message: 'Mock payment verified successfully.' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        // Payment is authentic; process enrollment
        const user = await User.findById(req.user.id);
        const course = await Course.findById(courseId);

        if (!user.enrolledCourses) user.enrolledCourses = [];

        if (!user.enrolledCourses.some(id => id.toString() === courseId)) {
            user.enrolledCourses.push(courseId);
            await user.save();

            course.enrolledStudents += 1;
            await course.save();
        }

        res.status(200).json({ success: true, message: 'Payment verified successfully.' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
});

exports.enrollFree = asyncHandler(async (req, res, next) => {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
        return next(new ErrorResponse('Course not found', 404));
    }

    if (course.price > 0) {
        return next(new ErrorResponse('Course requires payment', 400));
    }

    const user = await User.findById(req.user.id);
    if (!user.enrolledCourses) user.enrolledCourses = [];

    if (!user.enrolledCourses.some(id => id.toString() === courseId)) {
        user.enrolledCourses.push(courseId);
        await user.save();

        course.enrolledStudents += 1;
        await course.save();
    }

    res.status(200).json({ success: true, message: 'Enrolled in free course successfully' });
});
