const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, required: true }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [questionSchema],
  scheduledStartTime: { type: Date },
  duration: { type: Number }, // duration in minutes
  deadline: { type: Date },
  targetGroup: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
