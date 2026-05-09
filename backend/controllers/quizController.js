const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');

exports.createManualQuiz = async (req, res) => {
  try {
    const { title, questions, scheduledStartTime, duration, deadline, targetGroup } = req.body;
    
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Title and at least one question are required' });
    }

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
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllQuizzes = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'student') {
      const User = require('../models/User');
      const student = await User.findById(req.user._id);
      if (student && student.groupCode) {
        filter.$or = [
          { targetGroup: null }, 
          { targetGroup: '' }, 
          { targetGroup: { $regex: new RegExp(`^${student.groupCode}$`, 'i') } }
        ];
      } else {
        filter.$or = [{ targetGroup: null }, { targetGroup: '' }];
      }
    }

    let quizzes = await Quiz.find(filter).select('-questions.correctAnswer -questions.explanation').populate('createdBy', 'name');
    
    if (req.user.role === 'student') {
      const attempts = await Attempt.find({ studentId: req.user._id }).select('quizId');
      const attemptedQuizIds = attempts.map(a => a.quizId.toString());
      
      quizzes = quizzes.map(q => {
        const quizObj = q.toObject();
        quizObj.hasAttempted = attemptedQuizIds.includes(quizObj._id.toString());
        return quizObj;
      });
    }

    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // If student, check limits and remove correct answers
    if (req.user.role === 'student') {
      if (quiz.targetGroup) {
        const User = require('../models/User');
        const student = await User.findById(req.user._id);
        if (!student || !student.groupCode || student.groupCode.toUpperCase() !== quiz.targetGroup.toUpperCase()) {
          return res.status(403).json({ message: 'This quiz is restricted to a specific group' });
        }
      }

      const existingAttempt = await Attempt.findOne({ studentId: req.user._id, quizId: req.params.id });
      if (existingAttempt) {
        return res.status(403).json({ message: 'You have already attempted this quiz' });
      }

      if (quiz.scheduledStartTime && new Date() < new Date(quiz.scheduledStartTime)) {
        return res.status(403).json({ message: 'This quiz has not started yet' });
      }

      if (quiz.deadline && new Date() > new Date(quiz.deadline)) {
        return res.status(403).json({ message: 'The deadline for this quiz has passed' });
      }

      const studentQuiz = quiz.toObject();
      studentQuiz.questions.forEach(q => {
        delete q.correctAnswer;
        delete q.explanation;
      });
      return res.json(studentQuiz);
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const existingAttempt = await Attempt.findOne({ studentId: req.user._id, quizId });
    if (existingAttempt) {
      return res.status(400).json({ message: 'You have already submitted this quiz' });
    }

    if (quiz.targetGroup) {
      const User = require('../models/User');
      const student = await User.findById(req.user._id);
      if (!student || !student.groupCode || student.groupCode.toUpperCase() !== quiz.targetGroup.toUpperCase()) {
        return res.status(403).json({ message: 'This quiz is restricted to a specific group' });
      }
    }

    let score = 0;
    const resultDetails = [];

    quiz.questions.forEach(question => {
      const studentAnswer = answers.find(a => a.questionId === question._id.toString());
      const selected = studentAnswer ? studentAnswer.selectedOption : null;
      const isCorrect = selected === question.correctAnswer;
      
      if (isCorrect) {
        score += 1;
      }

      resultDetails.push({
        questionId: question._id,
        selected,
        correct: isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });
    });

    const attempt = await Attempt.create({
      studentId: req.user._id,
      quizId,
      answers,
      score,
      resultDetails
    });

    res.status(201).json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ studentId: req.user._id })
      .populate('quizId', 'title')
      .sort({ createdAt: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttemptById = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id).populate('quizId');
        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }
        res.json(attempt);
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
}

exports.getQuizResultsForTeacher = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these results' });
    }

    const attempts = await Attempt.find({ quizId })
      .populate('studentId', 'name email')
      .sort({ score: -1, createdAt: 1 });
      
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getQuizzesByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const filter = { createdBy: teacherId };
    
    if (req.user.role === 'student') {
      const User = require('../models/User');
      const student = await User.findById(req.user._id);
      if (student && student.groupCode) {
        filter.$or = [
          { targetGroup: null }, 
          { targetGroup: '' }, 
          { targetGroup: { $regex: new RegExp(`^${student.groupCode}$`, 'i') } }
        ];
      } else {
        filter.$or = [{ targetGroup: null }, { targetGroup: '' }];
      }
    }

    let quizzes = await Quiz.find(filter)
      .select('-questions.correctAnswer -questions.explanation')
      .populate('createdBy', 'name subject');

    if (req.user.role === 'student') {
      const attempts = await Attempt.find({ studentId: req.user._id }).select('quizId');
      const attemptedQuizIds = attempts.map(a => a.quizId.toString());
      
      quizzes = quizzes.map(q => {
        const quizObj = q.toObject();
        quizObj.hasAttempted = attemptedQuizIds.includes(quizObj._id.toString());
        return quizObj;
      });
    }

    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSubjectsWithStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    const User = require('../models/User');
    const teachers = await User.find({ role: 'teacher' }).select('name email subject');
    
    const studentUser = await User.findById(studentId);
    const studentGroup = studentUser.groupCode;
    
    const quizzes = await Quiz.find();
    const attempts = await Attempt.find({ studentId }).select('quizId');
    const attemptedQuizIds = attempts.map(a => a.quizId.toString());

    const subjects = teachers.map(teacher => {
      const teacherQuizzes = quizzes.filter(q => {
        if (q.createdBy.toString() !== teacher._id.toString()) return false;
        if (q.targetGroup && (!studentGroup || q.targetGroup.toUpperCase() !== studentGroup.toUpperCase())) return false;
        return true;
      });
      
      let newQuizCount = 0;
      let upcomingQuizCount = 0;
      teacherQuizzes.forEach(q => {
        const isAttempted = attemptedQuizIds.includes(q._id.toString());
        const isFuture = q.scheduledStartTime && new Date() < new Date(q.scheduledStartTime);
        const isExpired = q.deadline && new Date() > new Date(q.deadline);
        
        if (!isAttempted) {
          if (isFuture) upcomingQuizCount++;
          else if (!isExpired) newQuizCount++;
        }
      });

      return {
        _id: teacher._id,
        name: teacher.name,
        subject: teacher.subject,
        newQuizCount,
        upcomingQuizCount,
        hasVisibleQuizzes: teacherQuizzes.length > 0
      };
    });

    res.json(subjects.filter(s => s.hasVisibleQuizzes));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this quiz' });
    }
    
    await Attempt.deleteMany({ quizId: quiz._id });
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
