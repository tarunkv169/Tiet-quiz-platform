const express = require('express');
const router = express.Router();
const { generateQuiz, getExplanation } = require('../controllers/aiController');
const { protect, teacherOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Teacher only
router.post('/generate-quiz', protect, teacherOnly, upload.single('document'), generateQuiz);

// Student (and teacher)
router.post('/explanation', protect, getExplanation);

module.exports = router;
