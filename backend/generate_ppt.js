const pptxgen = require('pptxgenjs');

let pptx = new pptxgen();

// Slide 1 - Title
let slide1 = pptx.addSlide();
slide1.addText('Virtual Classroom System\nProject Review Assessment', {
    x: 0.5, y: 1.5, w: 9, h: 2,
    fontSize: 36, bold: true, align: 'center', color: '363636'
});
slide1.addText('A comprehensive review of the MERN stack architecture, security, and state management.', {
    x: 0.5, y: 3.5, w: 9, h: 1,
    fontSize: 18, align: 'center', color: '666666'
});

// Slide 2 - Backend API Development
let slide2 = pptx.addSlide();
slide2.addText('1. Backend API Development', { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 24, bold: true, color: '003366' });
slide2.addText('Status: ✅ Done', { x: 0.5, y: 1.2, w: 9, h: 0.5, fontSize: 16, bold: true, color: '008000' });
slide2.addText([
    { text: 'Design & Implementation: ', options: { bold: true } },
    { text: 'Well-organized RESTful API structure with routes in backend/src/routes.' }
], { x: 0.5, y: 2.0, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide2.addText([
    { text: 'Architectural Standards: ', options: { bold: true } },
    { text: 'Follows REST conventions (GET, POST, PUT, DELETE).' }
], { x: 0.5, y: 2.6, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide2.addText([
    { text: 'Testability & Scalability: ', options: { bold: true } },
    { text: 'Clean separation of concerns using controllers and asyncHandler.' }
], { x: 0.5, y: 3.2, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide2.addText([
    { text: 'Features Supported: ', options: { bold: true } },
    { text: 'Includes file upload capabilities via uploadMiddleware.js.' }
], { x: 0.5, y: 3.8, w: 9, h: 0.5, fontSize: 14, bullet: true });

// Slide 3 - Database & Auth Integration
let slide3 = pptx.addSlide();
slide3.addText('2. Database & Auth Integration', { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 24, bold: true, color: '003366' });
slide3.addText('Status: ✅ Done', { x: 0.5, y: 1.2, w: 9, h: 0.5, fontSize: 16, bold: true, color: '008000' });
slide3.addText([
    { text: 'Database: ', options: { bold: true } },
    { text: 'Successful connection to MongoDB (connectDB()) initialized securely.' }
], { x: 0.5, y: 2.0, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide3.addText([
    { text: 'Authentication Protocol: ', options: { bold: true } },
    { text: 'Secure JWT-based authentication implemented in authMiddleware.js.' }
], { x: 0.5, y: 2.6, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide3.addText([
    { text: 'Access Control: ', options: { bold: true } },
    { text: 'Robust token verification, user retrieval (protect), and role-based access control (authorize).' }
], { x: 0.5, y: 3.2, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide3.addText([
    { text: 'Integrations: ', options: { bold: true } },
    { text: 'Native Google Auth integration supported.' }
], { x: 0.5, y: 3.8, w: 9, h: 0.5, fontSize: 14, bullet: true });

// Slide 4 - Full-Stack CRUD
let slide4 = pptx.addSlide();
slide4.addText('3. Full-Stack CRUD', { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 24, bold: true, color: '003366' });
slide4.addText('Status: ✅ Done', { x: 0.5, y: 1.2, w: 9, h: 0.5, fontSize: 16, bold: true, color: '008000' });
slide4.addText([
    { text: 'Frontend/Backend Sync: ', options: { bold: true } },
    { text: 'Seamless client-server interaction via axios (frontend/src/lib/api.ts).' }
], { x: 0.5, y: 2.0, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide4.addText([
    { text: 'Complete Lifecycle Implementation: ', options: { bold: true } },
    { text: 'Verified across models (e.g., Assignments).' }
], { x: 0.5, y: 2.6, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide4.addText('• Create: createAssignment\n• Read: getAssignments, getAssignment\n• Update: updateAssignment, gradeSubmission\n• Delete: deleteAssignment', { x: 1.0, y: 3.2, w: 8, h: 1.5, fontSize: 14 });

// Slide 5 - State Management
let slide5 = pptx.addSlide();
slide5.addText('4. State Management', { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 24, bold: true, color: '003366' });
slide5.addText('Status: ✅ Done', { x: 0.5, y: 1.2, w: 9, h: 0.5, fontSize: 16, bold: true, color: '008000' });
slide5.addText([
    { text: 'React Architecture: ', options: { bold: true } },
    { text: 'Extensive use of React Hooks (useState, useEffect, useContext).' }
], { x: 0.5, y: 2.0, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide5.addText([
    { text: 'Global State Contexts: ', options: { bold: true } },
    { text: 'AuthContext (Real-time session) and SocketContext (Messaging).' }
], { x: 0.5, y: 2.6, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide5.addText([
    { text: 'Server State Management: ', options: { bold: true } },
    { text: 'Strategic use of @tanstack/react-query for optimized data fetching, caching, and mutation synchronization.' }
], { x: 0.5, y: 3.2, w: 9, h: 1.0, fontSize: 14, bullet: true });

// Slide 6 - Error Handling & Security
let slide6 = pptx.addSlide();
slide6.addText('5. Error Handling & Security', { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 24, bold: true, color: '003366' });
slide6.addText('Status: ✅ Done', { x: 0.5, y: 1.2, w: 9, h: 0.5, fontSize: 16, bold: true, color: '008000' });
slide6.addText([
    { text: 'Input Validation: ', options: { bold: true } },
    { text: 'Strict payload validation using express-validator.' }
], { x: 0.5, y: 2.0, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide6.addText([
    { text: 'Security Headers & Protection: ', options: { bold: true } }
], { x: 0.5, y: 2.6, w: 9, h: 0.5, fontSize: 14, bullet: true });
slide6.addText('• helmet(): Secure HTTP headers.\n• mongoSanitize(): NoSQL injection prevention.\n• xss(): Cross-site scripting (XSS) defense.\n• rateLimit(): Brute-force/DDoS mitigation.', { x: 1.0, y: 3.0, w: 8, h: 1.0, fontSize: 14 });
slide6.addText([
    { text: 'Error Logging: ', options: { bold: true } },
    { text: 'Centralized JSON error formatting via errorMiddleware.js.' }
], { x: 0.5, y: 4.2, w: 9, h: 0.5, fontSize: 14, bullet: true });

// Slide 7 - Conclusion
let slide7 = pptx.addSlide();
slide7.addText('Conclusion\n🌟 Fully Meets Criteria', { x: 0.5, y: 1.5, w: 9, h: 1.5, fontSize: 32, bold: true, align: 'center', color: '003366' });
slide7.addText('The Virtual Classroom System successfully exhibits a professional, scalable, and secure architecture utilizing the best practices of modern full-stack development. All listed criteria have been successfully implemented and properly integrated.', { x: 0.5, y: 3.5, w: 9, h: 1.5, fontSize: 16, align: 'center', color: '333333' });

pptx.writeFile({ fileName: '../Virtual_Classroom_System_Review.pptx' }).then(fileName => {
    console.log(`Created Presentation: ${fileName}`);
});
