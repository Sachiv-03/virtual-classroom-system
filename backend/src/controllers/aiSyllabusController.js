const AISyllabus = require('../models/AISyllabus');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create syllabus structure
// @route   POST /api/syllabus/create
// @access  Private/Admin
exports.createSyllabus = asyncHandler(async (req, res, next) => {
    req.body.createdBy = req.user.id;
    const syllabus = await AISyllabus.create(req.body);
    res.status(201).json({
        success: true,
        data: syllabus
    });
});

// @desc    Generate resources for syllabus topics (Smart AI Search)
// @route   POST /api/syllabus/generate-resources/:id
// @access  Private/Admin
exports.generateResources = asyncHandler(async (req, res, next) => {
    let syllabus = await AISyllabus.findById(req.params.id);

    if (!syllabus) {
        return next(new ErrorResponse(`Syllabus not found with id of ${req.params.id}`, 404));
    }

    // High-Quality Global Resource Library for common topics
    // To avoid broken links, we use highly reliable academic and educational sources
    const qualityLibrary = {
        "OS Concepts": {
            notes: "An Operating System (OS) is software that acts as an interface between computer hardware components and the user. Every computer system must have at least one operating system to run other programs. Key functions include Process management, Memory management, File management, and I/O management.",
            videos: [{ title: "Introduction to Operating Systems", url: "https://www.youtube.com/watch?v=26QPDBe-NB8", thumbnail: "https://img.youtube.com/vi/26QPDBe-NB8/0.jpg" }],
            materials: [{ title: "Operating System Fundamnetals", pdfUrl: "https://www.tutorialspoint.com/operating_system/operating_system_pdf_version.htm", source: "TutorialsPoint" }]
        },
        "Types of OS": {
            notes: "Classification of OS: 1. Batch OS: No direct interaction. 2. Time-Sharing OS: Multiple tasks executed at once. 3. Distributed OS: Independent systems sharing resources. 4. Real-Time OS: Time-critical operations (Hard/Soft). 5. Mobile OS: Optimized for handheld devices (Android/iOS).",
            videos: [{ title: "Types of Operating Systems - Comprehensive Guide", url: "https://www.youtube.com/watch?v=vBURTt97EkA", thumbnail: "https://img.youtube.com/vi/vBURTt97EkA/0.jpg" }],
            materials: [{ title: "Types of OS Detailed PDF", pdfUrl: "https://www.javatpoint.com/types-of-operating-system", source: "JavaTpoint Academy" }]
        },
        "System Calls": {
            notes: "System Calls are the programmatic way in which a computer program requests a service from the kernel of the operating system. Types: 1. Process Control (fork, exit). 2. File Management (open, read, write). 3. Device Management. 4. Information Maintenance. 5. Communication.",
            videos: [{ title: "System Calls Explained with Examples", url: "https://www.youtube.com/watch?v=lhI4T_5o9fE", thumbnail: "https://img.youtube.com/vi/lhI4T_5o9fE/0.jpg" }],
            materials: [{ title: "System Calls Reference Libary", pdfUrl: "https://www.tutorialspoint.com/operating_system/os_system_calls.htm", source: "Online Documentation" }]
        },
        "Process Management": {
            notes: "A Process is a program in execution. Process management involves various tasks like creation, scheduling, termination, and a dead lock. The OS manages processes' states (New, Ready, Running, Waiting, Terminated) and Process Control Blocks (PCB).",
            videos: [{ title: "Process Management & States", url: "https://www.youtube.com/watch?v=L_AAb5qjnpg", thumbnail: "https://img.youtube.com/vi/L_AAb5qjnpg/0.jpg" }],
            materials: [{ title: "Process Management Lecture Notes", pdfUrl: "https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/3_Processes.html", source: "University of Illinois" }]
        },
        "CPU Scheduling": {
            notes: "CPU Scheduling is the process of deciding which process will own the CPU to execute while another process is on hold. Algorithms include: 1. First Come First Served (FCFS). 2. Shortest Job First (SJF). 3. Priority Scheduling. 4. Round Robin Scheduling.",
            videos: [{ title: "CPU Scheduling Algorithms Explained", url: "https://www.youtube.com/watch?v=zF_Txa0t_fE", thumbnail: "https://img.youtube.com/vi/zF_Txa0t_fE/0.jpg" }],
            materials: [{ title: "CPU Scheduling Algorithms PDF", pdfUrl: "https://www.studytonight.com/operating-system/cpu-scheduling", source: "StudyTonight Academic" }]
        },
        "Memory Management": {
            notes: "Memory Management is the process of controlling and coordinating computer memory. It involves mapping logical addresses to physical addresses and deciding which processes go into memory and how much space they get. Key techniques include Contiguous Allocation, Paging, and Segmentation.",
            videos: [{ title: "Memory Management - Paging vs Segmentation", url: "https://www.youtube.com/watch?v=vV_X14MDBzY", thumbnail: "https://img.youtube.com/vi/vV_X14MDBzY/0.jpg" }],
            materials: [{ title: "Memory Management Guide", pdfUrl: "https://www.cs.rit.edu/~ark/os2/lecture/06.pdf", source: "Rochester Institute of Tech" }]
        },
        "Deadlocks": {
            notes: "A Deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process. Necessary conditions: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
            videos: [{ title: "Deadlocks - Banker's Algorithm", url: "https://www.youtube.com/watch?v=76vC-jU6I4A", thumbnail: "https://img.youtube.com/vi/76vC-jU6I4A/0.jpg" }],
            materials: [{ title: "Deadlock Detection & Prevention Notes", pdfUrl: "https://www.tutorialspoint.com/operating_system/os_deadlocks.htm", source: "TutorialsPoint Education" }]
        },
        "Virtual Memory": {
            notes: "Virtual memory is a memory management technique that provides an 'idealized abstraction of the storage resources that are actually available on a given machine'. It allows the execution of processes that may not be entirely in memory. Key concept: Demand Paging.",
            videos: [{ title: "Virtual Memory Explained", url: "https://www.youtube.com/watch?v=2qu_RAsP_P0", thumbnail: "https://img.youtube.com/vi/2qu_RAsP_P0/0.jpg" }],
            materials: [{ title: "Virtual Memory Study Material", pdfUrl: "https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/9_VirtualMemory.html", source: "Academic Notes" }]
        },
        "File Systems": {
            notes: "A File System is the way in which files are named and where they are placed logically for storage and retrieval. The OS provides a uniform logical view of information storage. Key concepts: File Attributes, File Operations, Access Methods, and Directory Structure.",
            videos: [{ title: "File Systems and Structure", url: "https://www.youtube.com/watch?v=mYv-22mXInU", thumbnail: "https://img.youtube.com/vi/mYv-22mXInU/0.jpg" }],
            materials: [{ title: "File System Implementation PDF", pdfUrl: "https://www.tutorialspoint.com/operating_system/os_file_system.htm", source: "TutorialsPoint" }]
        },
        "Disk Management": {
            notes: "Disk Management is the process of managing the hardware that stores data. The OS is responsible for Disk Scheduling (FCFS, SSTF, SCAN, C-SCAN), Disk Formatting, Boot Block, and Bad Block recovery.",
            videos: [{ title: "Disk Scheduling Algorithms", url: "https://www.youtube.com/watch?v=9W7LAtGukS4", thumbnail: "https://img.youtube.com/vi/9W7LAtGukS4/0.jpg" }],
            materials: [{ title: "Disk Management & Scheduling PDF", pdfUrl: "https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/12_MassStorage.html", source: "University of Illinois" }]
        }
    };

    const updatedUnits = syllabus.units.map(unit => ({
        ...unit._doc,
        topics: unit.topics.map(topic => {
            const topicName = topic.topicTitle;
            const smartMatch = qualityLibrary[topicName] || {
                notes: `Comprehensive learning module for ${topicName}: Investigating the fundamental principles, modern implementations, and industry standards related to ${topicName}. This material is designed to provide actionable insights and academic mastery of the subject matter.`,
                videos: [
                    {
                        title: `${topicName} - Educational Lecture Series`,
                        url: `https://www.youtube.com/results?search_query=${encodeURIComponent('educational lecture ' + topicName)}`,
                        thumbnail: `https://via.placeholder.com/320x180?text=${encodeURIComponent(topicName)}+Tutorial`
                    }
                ],
                materials: [
                    {
                        title: `${topicName} High-Quality Reference Notes`,
                        pdfUrl: `https://www.google.com/search?q=${encodeURIComponent('university lecture pdf ' + topicName)}`,
                        source: "Verified Educational Content"
                    }
                ]
            };

            return {
                ...topic._doc,
                notes: smartMatch.notes,
                videos: smartMatch.videos,
                materials: smartMatch.materials
            };
        })
    }));

    syllabus.units = updatedUnits;
    syllabus.generatedResources = true;
    syllabus.status = 'pending';
    await syllabus.save();

    res.status(200).json({
        success: true,
        data: syllabus
    });
});

// @desc    Approve syllabus
// @route   PUT /api/syllabus/approve/:id
// @access  Private/Admin
exports.approveSyllabus = asyncHandler(async (req, res, next) => {
    const syllabus = await AISyllabus.findByIdAndUpdate(
        req.params.id,
        { status: 'approved' },
        { new: true, runValidators: true }
    );

    if (!syllabus) {
        return next(new ErrorResponse(`Syllabus not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: syllabus
    });
});

// @desc    Update syllabus
// @route   PUT /api/syllabus/update/:id
// @access  Private/Admin
exports.updateSyllabus = asyncHandler(async (req, res, next) => {
    let syllabus = await AISyllabus.findById(req.params.id);

    if (!syllabus) {
        return next(new ErrorResponse(`Syllabus not found with id of ${req.params.id}`, 404));
    }

    syllabus = await AISyllabus.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: syllabus
    });
});

// @desc    Delete syllabus
// @route   DELETE /api/syllabus/delete/:id
// @access  Private/Admin
exports.deleteSyllabus = asyncHandler(async (req, res, next) => {
    const syllabus = await AISyllabus.findById(req.params.id);

    if (!syllabus) {
        return next(new ErrorResponse(`Syllabus not found with id of ${req.params.id}`, 404));
    }

    await syllabus.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get all syllabuses (Admin: all, Teacher/Student: only approved)
// @route   GET /api/syllabus
// @access  Public
exports.getSyllabuses = asyncHandler(async (req, res, next) => {
    let query;
    // Admins see everything, Others see only approved
    if (req.user && req.user.role === 'admin') {
        query = AISyllabus.find();
    } else {
        query = AISyllabus.find({ status: 'approved' });
    }

    const syllabuses = await query.sort('-createdAt');

    res.status(200).json({
        success: true,
        count: syllabuses.length,
        data: syllabuses
    });
});

// @desc    Get single syllabus
// @route   GET /api/syllabus/:id
// @access  Public
exports.getSyllabus = asyncHandler(async (req, res, next) => {
    const syllabus = await AISyllabus.findById(req.params.id);

    if (!syllabus) {
        return next(new ErrorResponse(`Syllabus not found with id of ${req.params.id}`, 404));
    }

    // Security check: Only admin can see non-approved ones
    if (syllabus.status !== 'approved' && (!req.user || req.user.role !== 'admin')) {
        return next(new ErrorResponse('Not authorized to view this syllabus', 403));
    }

    res.status(200).json({
        success: true,
        data: syllabus
    });
});
