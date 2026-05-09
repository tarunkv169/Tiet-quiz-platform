const mongoose = require('mongoose');

const resultDetailSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selected: { type: String },
  correct: { type: Boolean, required: true },
  correctAnswer: { type: String },
  explanation: { type: String }
});

const attemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    selectedOption: String
  }],
  score: { type: Number, required: true },
  resultDetails: [resultDetailSchema]
}, { timestamps: true });

module.exports = mongoose.model('Attempt', attemptSchema);
