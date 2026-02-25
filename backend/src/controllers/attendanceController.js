const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const PDFDocument = require('pdfkit');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

// @desc    Mark attendance
// @route   POST /api/attendance/mark
// @access  Private
exports.markAttendance = asyncHandler(async (req, res, next) => {
    const { courseId } = req.body;
    const studentId = req.user.id;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
        student: studentId,
        course: courseId,
        date: startOfDay
    });

    if (attendance) {
        return res.status(200).json({
            success: true,
            data: attendance
        });
    }

    attendance = await Attendance.create({
        student: studentId,
        course: courseId,
        date: startOfDay,
        status: 'Present',
        checkInTime: new Date()
    });

    res.status(201).json({
        success: true,
        data: attendance
    });
});

// @desc    Get attendance analytics
// @route   GET /api/attendance/analytics/:courseId
// @access  Private
exports.getAnalytics = asyncHandler(async (req, res, next) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const totalLectures = 30; // Mock value
    const attendedLectures = await Attendance.countDocuments({
        student: studentId,
        course: courseId,
        status: 'Present'
    });

    const attendancePercentage = (attendedLectures / totalLectures) * 100;

    const monthlyData = await Attendance.aggregate([
        {
            $match: {
                student: new mongoose.Types.ObjectId(studentId),
                course: new mongoose.Types.ObjectId(courseId)
            }
        },
        {
            $group: {
                _id: { $month: "$date" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    res.json({
        success: true,
        data: {
            totalLectures,
            attendedLectures,
            attendancePercentage: attendancePercentage.toFixed(2),
            monthlyData
        }
    });
});

// @desc    Get all attendance records for user
// @route   GET /api/attendance/all
// @access  Private
exports.getAllAttendance = asyncHandler(async (req, res, next) => {
    const studentId = req.user.id;
    const attendances = await Attendance.find({ student: studentId })
        .populate('course', 'title')
        .sort({ date: -1 });

    res.json({
        success: true,
        count: attendances.length,
        data: attendances
    });
});

// @desc    Generate attendance report PDF
// @route   GET /api/attendance/report/:courseId
// @access  Private
exports.generateReport = asyncHandler(async (req, res, next) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const attendances = await Attendance.find({
        student: studentId,
        course: courseId
    }).populate('course', 'title').sort({ date: 1 });

    if (attendances.length === 0) {
        return next(new ErrorResponse('No attendance records found', 404));
    }

    const doc = new PDFDocument();
    const filename = `attendance_report_${studentId}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Monthly Attendance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Course: ${attendances[0].course.title}`);
    doc.text(`Student ID: ${studentId}`);
    doc.moveDown();

    // Table Header
    const tableTop = 200;
    const itemHeight = 30;

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Date', 50, tableTop);
    doc.text('Status', 200, tableTop);
    doc.text('Check-in Time', 350, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let currentHeight = tableTop + 30;
    doc.font('Helvetica');

    attendances.forEach(record => {
        const date = new Date(record.date).toLocaleDateString();
        const time = new Date(record.checkInTime).toLocaleTimeString();

        doc.text(date, 50, currentHeight);
        doc.text(record.status, 200, currentHeight);
        doc.text(time, 350, currentHeight);

        currentHeight += itemHeight;
    });

    doc.end();
});

// @desc    Update attendance status
// @route   PUT /api/attendance/update
// @access  Private/Teacher
exports.updateAttendance = asyncHandler(async (req, res, next) => {
    const { attendanceId, status } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
        return next(new ErrorResponse('Attendance record not found', 404));
    }

    attendance.status = status || attendance.status;
    await attendance.save();

    res.json({
        success: true,
        data: attendance
    });
});
