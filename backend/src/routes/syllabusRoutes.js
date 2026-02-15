const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');
const upload = require('../middleware/uploadMiddleware');

// Define routes
router.post('/upload', upload.single('file'), syllabusController.uploadSyllabus);
router.get('/', syllabusController.getAllSyllabi);
router.get('/:id', syllabusController.getSyllabusById);
router.get('/semester/:semester', syllabusController.getSyllabusBySemester);
router.put('/:id', syllabusController.updateSyllabus);
router.delete('/:id', syllabusController.deleteSyllabus);

module.exports = router;
