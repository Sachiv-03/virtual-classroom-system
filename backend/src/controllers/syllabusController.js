const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse'); // Ensure this package is installed: npm install pdf-parse
const Syllabus = require('../models/Syllabus');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Helper function to extract structured data from PDF text
const extractSyllabusData = (text) => {
    const data = {
        courseTitle: '',
        courseCode: '',
        semester: '',
        academicYear: '',
        description: '',
        units: [],
        learningOutcomes: [],
        textbooks: [],
        references: []
    };

    // --- Basic Header Parsing (Naive Heuristics) ---
    const codeMatch = text.match(/Course\s*Code\s*[:\-\s]\s*([A-Z]{2,}\s*[0-9]{3,})/i) ||
        text.match(/([A-Z]{2,}[0-9]{3,})/);
    if (codeMatch) data.courseCode = codeMatch[1].trim();

    const semMatch = text.match(/Semester\s*[:\-\s]\s*([IVX0-9]+)/i);
    if (semMatch) data.semester = semMatch[1].trim();

    const yearMatch = text.match(/Academic\s*Year\s*[:\-\s]\s*([0-9]{4}\s*-\s*[0-9]{2,4})/i);
    if (yearMatch) data.academicYear = yearMatch[1].trim();
    else data.academicYear = new Date().getFullYear().toString();

    const titleMatch = text.match(/Course\s*(?:Title|Name)\s*[:\-\s](.+)/i);
    if (titleMatch) {
        data.courseTitle = titleMatch[1].trim();
    } else {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
        if (lines.length > 0) data.courseTitle = lines[0];
    }

    // --- Parse Units ---
    const unitRegex = /(?:UNIT|Unit|Module|Chapter)\s+([IVX0-9]+)(?:\s*[:\-])?/g;
    let match;
    let lastIndex = 0;
    let currentUnit = null;

    while ((match = unitRegex.exec(text)) !== null) {
        if (currentUnit) {
            const content = text.substring(lastIndex, match.index).trim();
            const contentLines = content.split('\n').map(l => l.trim()).filter(l => l);
            if (contentLines.length > 0) {
                currentUnit.unitTitle = contentLines[0];
                currentUnit.topics = contentLines.slice(1);
            }
            data.units.push(currentUnit);
        }

        currentUnit = { unitNo: match[1], unitTitle: '', topics: [] };
        lastIndex = unitRegex.lastIndex;
    }

    if (currentUnit) {
        const content = text.substring(lastIndex).trim();
        const stopIndex = content.search(/(Text\s*Books|References|Course\s*Outcomes)/i);
        const unitContent = stopIndex !== -1 ? content.substring(0, stopIndex) : content;

        const contentLines = unitContent.split('\n').map(l => l.trim()).filter(l => l);
        if (contentLines.length > 0) {
            currentUnit.unitTitle = contentLines[0];
            currentUnit.topics = contentLines.slice(1);
        }
        data.units.push(currentUnit);
    }

    const textBooksSection = text.match(/(?:Text\s*Books?|Reference\s*Books?)([\s\S]*?)(?:Course\s*Outcomes|Unit|$)/i);
    if (textBooksSection) {
        data.textbooks = textBooksSection[1].split('\n').map(l => l.trim()).filter(l => l.length > 3);
    }

    return data;
};

// @desc    Upload Syllabus PDF and Parse
// @route   POST /api/syllabus/upload
// @access  Admin
exports.uploadSyllabus = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);

    // Parse PDF
    const pdfData = await pdf(dataBuffer);
    const extractedText = pdfData.text;

    // Auto-structure Content
    const structuredData = extractSyllabusData(extractedText);
    structuredData.pdfPath = filePath;

    // Create new Syllabus entry
    const syllabus = new Syllabus(structuredData);
    await syllabus.save();

    res.status(201).json({
        success: true,
        message: 'Syllabus uploaded and parsed successfully',
        data: syllabus
    });
});

// @desc    Get Syllabus by ID
// @route   GET /api/syllabus/:id
// @access  Public
exports.getSyllabusById = asyncHandler(async (req, res, next) => {
    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus) {
        return next(new ErrorResponse(`Syllabus not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: syllabus
    });
});

// @desc    Get All Syllabi
// @route   GET /api/syllabus
// @access  Public
exports.getAllSyllabi = asyncHandler(async (req, res, next) => {
    const syllabi = await Syllabus.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: syllabi.length,
        data: syllabi
    });
});

// @desc    Get Syllabus by Semester
// @route   GET /api/syllabus/semester/:semester
// @access  Public
exports.getSyllabusBySemester = asyncHandler(async (req, res, next) => {
    const syllabi = await Syllabus.find({ semester: req.params.semester });
    res.status(200).json({
        success: true,
        count: syllabi.length,
        data: syllabi
    });
});

// @desc    Update Syllabus
// @route   PUT /api/syllabus/:id
// @access  Admin
exports.updateSyllabus = asyncHandler(async (req, res, next) => {
    let syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
        return next(new ErrorResponse(`Syllabus not found with id of ${req.params.id}`, 404));
    }

    syllabus = await Syllabus.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: syllabus
    });
});

// @desc    Delete Syllabus
// @route   DELETE /api/syllabus/:id
// @access  Admin
exports.deleteSyllabus = asyncHandler(async (req, res, next) => {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
        return next(new ErrorResponse(`Syllabus not found with id of ${req.params.id}`, 404));
    }

    // Delete PDF file
    if (syllabus.pdfPath && fs.existsSync(syllabus.pdfPath)) {
        fs.unlinkSync(syllabus.pdfPath);
    }

    await syllabus.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});
