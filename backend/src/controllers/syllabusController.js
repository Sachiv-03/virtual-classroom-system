const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse'); // Ensure this package is installed: npm install pdf-parse
const Syllabus = require('../models/Syllabus');

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
    // Try to find Course Code (e.g., CS101, MAT202)
    const codeMatch = text.match(/Course\s*Code\s*[:\-\s]\s*([A-Z]{2,}\s*[0-9]{3,})/i) ||
        text.match(/([A-Z]{2,}[0-9]{3,})/); // Fallback to just looking for code-like pattern
    if (codeMatch) data.courseCode = codeMatch[1].trim();

    // Try to find Semester (e.g., Semester IV, Semester 4)
    const semMatch = text.match(/Semester\s*[:\-\s]\s*([IVX0-9]+)/i);
    if (semMatch) data.semester = semMatch[1].trim();

    // Try to find Academic Year (e.g., 2023-2024, 2023-24)
    const yearMatch = text.match(/Academic\s*Year\s*[:\-\s]\s*([0-9]{4}\s*-\s*[0-9]{2,4})/i);
    if (yearMatch) data.academicYear = yearMatch[1].trim();
    else data.academicYear = new Date().getFullYear().toString(); // Default if not found

    // Try to find Course Title (Usually the first non-empty line or near "Course Name")
    const titleMatch = text.match(/Course\s*(?:Title|Name)\s*[:\-\s](.+)/i);
    if (titleMatch) {
        data.courseTitle = titleMatch[1].trim();
    } else {
        // Fallback: Use the first significant line as title
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
        if (lines.length > 0) data.courseTitle = lines[0];
    }

    // --- Parse Units ---
    // Look for patterns like "UNIT I", "Unit 1", "Module 1"
    // We split the text by these markers.
    const unitRegex = /(?:UNIT|Unit|Module|Chapter)\s+([IVX0-9]+)(?:\s*[:\-])?/g;
    let match;
    let lastIndex = 0;
    let currentUnit = null;

    // Reset regex index
    while ((match = unitRegex.exec(text)) !== null) {
        if (currentUnit) {
            // Capture text for the previous unit
            const content = text.substring(lastIndex, match.index).trim();
            // Split content into title and topics roughly
            const contentLines = content.split('\n').map(l => l.trim()).filter(l => l);
            if (contentLines.length > 0) {
                // Assume first line after UNIT X is the unit title
                currentUnit.unitTitle = contentLines[0];
                // Rest are topics
                currentUnit.topics = contentLines.slice(1);
            }
            data.units.push(currentUnit);
        }

        currentUnit = { unitNo: match[1], unitTitle: '', topics: [] };
        lastIndex = unitRegex.lastIndex; // Move past "UNIT I"
    }

    // Capture the last unit
    if (currentUnit) {
        const content = text.substring(lastIndex).trim();
        // Stop capturing if we hit "Textbooks" or "References"
        const stopIndex = content.search(/(Text\s*Books|References|Course\s*Outcomes)/i);
        const unitContent = stopIndex !== -1 ? content.substring(0, stopIndex) : content;

        const contentLines = unitContent.split('\n').map(l => l.trim()).filter(l => l);
        if (contentLines.length > 0) {
            currentUnit.unitTitle = contentLines[0];
            currentUnit.topics = contentLines.slice(1);
        }
        data.units.push(currentUnit);
    }

    // --- Extract Textbooks/References (Basic) ---
    const textBooksSection = text.match(/(?:Text\s*Books?|Reference\s*Books?)([\s\S]*?)(?:Course\s*Outcomes|Unit|$)/i);
    if (textBooksSection) {
        data.textbooks = textBooksSection[1].split('\n').map(l => l.trim()).filter(l => l.length > 3);
    }

    return data;
};

// @desc    Upload Syllabus PDF and Parse
// @route   POST /api/syllabus/upload
// @access  Admin
exports.uploadSyllabus = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filePath = req.file.path;

        // Read the file buffer
        const dataBuffer = fs.readFileSync(filePath);

        // Parse PDF
        const pdfData = await pdf(dataBuffer);
        const extractedText = pdfData.text;

        // Auto-structure Content
        const structuredData = extractSyllabusData(extractedText);

        // Add file path to structured data
        structuredData.pdfPath = filePath;

        // Create new Syllabus entry
        const syllabus = new Syllabus(structuredData);
        await syllabus.save();

        res.status(201).json({
            message: 'Syllabus uploaded and parsed successfully',
            syllabus: syllabus
        });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            // Duplicate key error
            res.status(400).json({ message: 'Syllabus for this Course Code and Academic Year already exists.' });
        } else {
            res.status(500).json({ message: 'Server Error during parsing or saving.' });
        }
    }
};

// @desc    Get Syllabus by Course ID (or Code? Using MongoDB ID for now)
// @route   GET /api/syllabus/:id
// @access  Public/Student
exports.getSyllabusById = async (req, res) => {
    try {
        const syllabus = await Syllabus.findById(req.params.id);
        if (!syllabus) return res.status(404).json({ message: 'Syllabus not found' });
        res.json(syllabus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Syllabi
// @route   GET /api/syllabus
// @access  Public
exports.getAllSyllabi = async (req, res) => {
    try {
        const syllabi = await Syllabus.find().sort({ createdAt: -1 });
        res.json(syllabi);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get Syllabus by Semester
// @route   GET /api/syllabus/semester/:semester
// @access  Public
exports.getSyllabusBySemester = async (req, res) => {
    try {
        const syllabi = await Syllabus.find({ semester: req.params.semester });
        res.json(syllabi);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Syllabus (for corrections after parsing)
// @route   PUT /api/syllabus/:id
// @access  Admin
exports.updateSyllabus = async (req, res) => {
    try {
        const syllabus = await Syllabus.findById(req.params.id);
        if (!syllabus) return res.status(404).json({ message: 'Syllabus not found' });

        const updatedSyllabus = await Syllabus.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedSyllabus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Syllabus
// @route   DELETE /api/syllabus/:id
// @access  Admin
exports.deleteSyllabus = async (req, res) => {
    try {
        const syllabus = await Syllabus.findById(req.params.id);
        if (!syllabus) return res.status(404).json({ message: 'Syllabus not found' });

        // Optionally delete the file too
        if (syllabus.pdfPath && fs.existsSync(syllabus.pdfPath)) {
            fs.unlinkSync(syllabus.pdfPath);
        }

        await Syllabus.deleteOne({ _id: req.params.id });
        res.json({ message: 'Syllabus removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
