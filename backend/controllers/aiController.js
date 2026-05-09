const { extractText, generateQuizFromText, generateExplanation } = require('../services/aiService');
const Quiz = require('../models/Quiz');

exports.generateQuiz = async (req, res) => {
  try {
    const { title, scheduledStartTime, duration, deadline, targetGroup } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!title) {
      return res.status(400).json({ message: 'Quiz title is required' });
    }

    // Extract text from the uploaded file
    const text = await extractText(req.file);
    
    // Check if text is too short or empty
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ message: 'Could not extract enough text from the document.' });
    }

    // Generate questions using AI
    const questions = await generateQuizFromText(text);

    // Save generated quiz to database
    const quiz = await Quiz.create({
      title,
      createdBy: req.user._id,
      questions,
      scheduledStartTime: scheduledStartTime || null,
      duration: duration || null,
      deadline: deadline || null,
      targetGroup: targetGroup ? targetGroup.toUpperCase() : null
    });

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ message: error.message || 'Error generating quiz from document' });
  }
};

exports.getExplanation = async (req, res) => {
  try {
    const { question, options, userAnswer, correctAnswer, studyMaterial } = req.body;

    if (!question || !userAnswer || !correctAnswer) {
      return res.status(400).json({ message: 'Missing required parameters (question, userAnswer, correctAnswer)' });
    }

    if (userAnswer === correctAnswer) {
      return res.json({ explanation: null });
    }

    const explanation = await generateExplanation(question, options, userAnswer, correctAnswer, studyMaterial);
    res.json({ explanation });
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ message: 'Error generating explanation' });
  }
};
