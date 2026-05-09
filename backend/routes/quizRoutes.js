const express = require('express');
const router = express.Router();
const { 
  createManualQuiz, 
  getAllQuizzes, 
  submitQuiz, 
  getTeacherQuizzes,
  getQuizById,
  getStudentAttempts,
  getAttemptById,
  getQuizResultsForTeacher,
  getQuizzesByTeacher,
  getSubjectsWithStats,
  deleteQuiz
} = require('../controllers/quizController');
const { protect, teacherOnly } = require('../middleware/auth');

// Teacher routes
router.post('/create-manual', protect, teacherOnly, createManualQuiz);
router.get('/teacher', protect, teacherOnly, getTeacherQuizzes);
router.get('/:id/results', protect, teacherOnly, getQuizResultsForTeacher);
router.delete('/:id', protect, teacherOnly, deleteQuiz);

// Student routes
router.get('/all', protect, getAllQuizzes);
router.get('/subjects', protect, getSubjectsWithStats);
router.get('/teacher/:teacherId', protect, getQuizzesByTeacher);
router.post('/submit', protect, submitQuiz);
router.get('/attempts', protect, getStudentAttempts);
router.get('/attempts/:id', protect, getAttemptById);

// General
router.get('/:id', protect, getQuizById);

module.exports = router;
