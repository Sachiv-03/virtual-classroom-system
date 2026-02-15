const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter - Allow all except dangerous executables
const fileFilter = (req, file, cb) => {
    const forbiddenExtensions = ['.exe', '.bat', '.sh', '.msi', '.com', '.cmd'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (forbiddenExtensions.includes(ext)) {
        cb(new Error('Dangerous file types are not allowed.'), false);
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // Increased to 50MB for general use
    }
});

module.exports = upload;
