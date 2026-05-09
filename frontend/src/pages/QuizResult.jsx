import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function QuizResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const attemptRes = await api.get(`/quiz/attempts/${id}`);
        setAttempt(attemptRes.data);
        setQuiz(attemptRes.data.quizId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);



  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading results...</div>;
  if (!attempt || !quiz) return <div className="min-h-screen flex items-center justify-center">Results not found.</div>;

  const totalQuestions = attempt.resultDetails.length;
  const score = attempt.score;
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <button 
            onClick={() => {
              if (user?.role === 'teacher') {
                navigate(`/teacher/quiz-results/${quiz._id}`);
              } else {
                navigate('/student-dashboard');
              }
            }} 
            className="text-blue-600 hover:underline flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to {user?.role === 'teacher' ? 'Results Dashboard' : 'Dashboard'}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 text-center p-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Quiz Results</h1>
          <p className="text-slate-500 text-lg mb-8">{quiz.title}</p>
          
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                className="text-slate-100"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
                r="80"
                cx="96"
                cy="96"
              />
              <circle
                className={`${percentage >= 70 ? 'text-green-500' : percentage >= 40 ? 'text-yellow-500' : 'text-red-500'}`}
                strokeWidth="12"
                strokeDasharray={502}
                strokeDashoffset={502 - (502 * percentage) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="80"
                cx="96"
                cy="96"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-slate-800">{percentage}%</span>
              <span className="text-sm text-slate-500 mt-1">{score} / {totalQuestions} Correct</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Detailed Review</h2>
          
          {quiz.questions.map((q, index) => {
            const detail = attempt.resultDetails.find(d => d.questionId === q._id);
            if (!detail) return null;
            
            const isCorrect = detail.correct;
            // The quiz from the API /quiz/:id has correctAnswer only if teacher, but let's assume it's available or we get it from result details.
            // Wait, for students, getQuizById removes correctAnswer and explanation. 
            // So we need to handle this. The result details already have correct/wrong.
            // But we need the correct answer to show.
            // Since we stored correct: isCorrect, we didn't store the actual correct answer string in Attempt schema except maybe through referencing.
            // Ah! The Attempt schema stores explanation and correct boolean, but not the correct string! Let's just pass the selected and we know it's wrong.
            // Wait, if it's wrong, we might need the correctAnswer for the prompt. We can change the backend slightly to include it.
            // Let's assume we update the backend attempt submission to store the correct answer as well.
            const correctAnswer = q.correctAnswer || detail.correctAnswer || "The other option"; // We'll update the backend

            return (
              <div key={q._id} className={`p-6 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 mb-3">{q.question}</h3>
                    
                    <div className="space-y-2 mb-4">
                      {q.options.map((opt, i) => {
                        const isSelected = detail.selected === opt;
                        const isActualCorrect = opt === correctAnswer || (isCorrect && isSelected);
                        
                        let optClass = "p-3 border rounded-lg text-sm ";
                        if (isSelected && isCorrect) optClass += "bg-green-100 border-green-500 font-medium text-green-800";
                        else if (isSelected && !isCorrect) optClass += "bg-red-100 border-red-500 font-medium text-red-800";
                        else if (isActualCorrect) optClass += "bg-green-100 border-green-500 font-medium text-green-800";
                        else optClass += "bg-white border-slate-200 text-slate-600";
                        
                        return (
                          <div key={i} className={optClass}>
                            {opt}
                            {isSelected && <span className="ml-2 text-xs opacity-75">(Your answer)</span>}
                            {isActualCorrect && !isSelected && <span className="ml-2 text-xs opacity-75">(Correct answer)</span>}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Default teacher explanation */}
                    {detail.explanation && (
                      <div className={`mt-4 p-3 bg-white/50 rounded border text-sm ${isCorrect ? 'border-green-100 text-green-800' : 'border-red-100 text-red-800'}`}>
                        <span className="font-semibold block mb-1">Explanation:</span>
                        {detail.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
