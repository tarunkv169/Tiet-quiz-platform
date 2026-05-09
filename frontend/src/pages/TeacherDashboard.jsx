import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await api.get('/quiz/teacher');
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch quizzes');
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz? All student attempts will also be deleted.")) return;
    try {
      await api.delete(`/quiz/${id}`);
      fetchQuizzes();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting quiz');
    }
  };

  // Group quizzes by targetGroup
  const groupedQuizzes = quizzes.reduce((acc, quiz) => {
    const group = quiz.targetGroup || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(quiz);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Teacher Dashboard</h1>
            <p className="text-slate-600">Welcome back, {user?.name}</p>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition">
            Logout
          </button>
        </header>

        {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => navigate('/teacher/create-quiz')}
            className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition text-left group"
          >
            <h3 className="text-xl font-semibold text-slate-800 group-hover:text-blue-600 transition">Create Quiz Manually &rarr;</h3>
            <p className="text-slate-500 mt-2">Add your own questions, options, and explanations.</p>
          </button>
          
          <button 
            onClick={() => navigate('/teacher/generate-quiz')}
            className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 hover:border-blue-500 hover:shadow-md transition text-left group"
          >
            <h3 className="text-xl font-semibold text-blue-900 group-hover:text-blue-700 transition">Generate with AI (Upload Material) &rarr;</h3>
            <p className="text-blue-700 mt-2">Upload a PDF or Text file to generate quiz instantly.</p>
          </button>
        </div>

        {/* Existing Quizzes */}
        <h2 className="text-2xl font-bold mb-6 text-slate-800">Your Quizzes</h2>
        {Object.keys(groupedQuizzes).length === 0 ? (
          <p className="text-slate-500">You haven't created any quizzes yet.</p>
        ) : (
          <div className="space-y-10">
            {Object.keys(groupedQuizzes).map(group => (
              <div key={group}>
                <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
                  <span className="bg-indigo-600 w-2 h-6 rounded-full mr-3"></span>
                  Group: {group}
                </h3>
                <div className="flex flex-col space-y-4">
                  {groupedQuizzes[group].map(quiz => (
                    <div key={quiz._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col md:flex-row justify-between items-center relative">
                      <div className="flex-1 w-full">
                        <h4 className="font-bold text-lg text-slate-800 mb-1">{quiz.title}</h4>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                          <span className="bg-slate-100 px-2 py-1 rounded">{quiz.questions?.length} Questions</span>
                          {quiz.duration && <span className="bg-slate-100 px-2 py-1 rounded">{quiz.duration} mins</span>}
                          {quiz.deadline && <span className="bg-red-50 text-red-600 px-2 py-1 rounded">Deadline: {new Date(quiz.deadline).toLocaleString()}</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-3">Created: {new Date(quiz.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="mt-4 md:mt-0 flex gap-3 w-full md:w-auto">
                        <button 
                          onClick={() => navigate(`/teacher/quiz-results/${quiz._id}`)}
                          className="flex-1 md:flex-none px-6 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition"
                        >
                          Results
                        </button>
                        <button 
                          onClick={() => handleDeleteQuiz(quiz._id)}
                          className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
