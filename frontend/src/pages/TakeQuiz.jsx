import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/quiz/${id}`);
        setQuiz(res.data);
        
        // Initialize answers array
        const initialAnswers = res.data.questions.map(q => ({
          questionId: q._id,
          selectedOption: ''
        }));
        setAnswers(initialAnswers);
        
        if (res.data.duration) {
          setTimeLeft(res.data.duration * 60);
        }
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setError(err.response.data.message);
        } else {
          console.error(err);
          setError('Error loading quiz');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting]);

  const handleSelectOption = (questionId, option) => {
    setAnswers(answers.map(ans => 
      ans.questionId === questionId ? { ...ans, selectedOption: option } : ans
    ));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    // Check if all questions are answered
    const unanswered = answers.some(ans => ans.selectedOption === '');
    if (unanswered && !isAutoSubmit) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.post('/quiz/submit', {
        quizId: id,
        answers
      });
      navigate(`/quiz-results/${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert('Error submitting quiz');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading quiz...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 text-xl font-bold">{error}</div>;
  if (!quiz) return <div className="min-h-screen flex items-center justify-center">Quiz not found.</div>;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <button onClick={() => navigate('/student-dashboard')} className="text-blue-600 hover:underline mb-4 inline-block">
              &larr; Back to Dashboard
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900">{quiz.title}</h1>
            <p className="mt-2 text-slate-500">Answer all questions below and click submit when you're done.</p>
          </div>
          {timeLeft !== null && (
            <div className={`px-4 py-2 rounded-lg font-bold text-xl shadow-sm border ${timeLeft < 60 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-slate-800 border-slate-200'}`}>
              Time Left: {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {quiz.questions.map((q, index) => {
            const currentAnswer = answers.find(a => a.questionId === q._id)?.selectedOption;
            
            return (
              <div key={q._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-medium text-slate-900 mb-4">
                  <span className="text-slate-500 mr-2">{index + 1}.</span>
                  {q.question}
                </h3>
                <div className="space-y-3">
                  {q.options.map((option, optIndex) => (
                    <label 
                      key={optIndex} 
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        currentAnswer === option ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${q._id}`}
                        value={option}
                        checked={currentAnswer === option}
                        onChange={() => handleSelectOption(q._id, option)}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-8 py-3 text-lg font-medium rounded-lg text-white ${
              submitting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-md'
            } transition`}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
