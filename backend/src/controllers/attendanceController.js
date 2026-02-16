const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const PDFDocument = require('pdfkit');

// Mark attendance
exports.markAttendance = async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user._id;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({
            student: studentId,
            course: courseId,
            date: startOfDay
        });

        if (attendance) {
            return res.status(200).json(attendance);
        }

        attendance = await Attendance.create({
            student: studentId,
            course: courseId,
            date: startOfDay,
            status: 'Present',
            checkInTime: new Date()
        });

        res.status(201).json(attendance);

    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ message: 'Server error marking attendance' });
    }
};

// Get attendance analytics for a student in a course
exports.getAnalytics = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user._id;

        const totalLectures = 30; // Hardcoded or fetch from Course model if available
        const attendedLectures = await Attendance.countDocuments({
            student: studentId,
            course: courseId,
            status: 'Present'
        });

        const attendancePercentage = (attendedLectures / totalLectures) * 100;

        const monthlyData = await Attendance.aggregate([
            {
                $match: {
                    student: studentId,
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
            totalLectures,
            attendedLectures,
            attendancePercentage: attendancePercentage.toFixed(2),
            monthlyData
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
};

// Generate monthly attendance report PDF
exports.generateReport = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user._id;

        const attendances = await Attendance.find({
            student: studentId,
            course: courseId
        }).populate('course', 'title').sort({ date: 1 });

        if (attendances.length === 0) {
            return res.status(404).json({ message: 'No attendance records found' });
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

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Server error generating report' });
    }
};
