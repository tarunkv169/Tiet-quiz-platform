import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('subjects'); // subjects, attempts

  useEffect(() => {
    fetchTeachers();
    fetchAttempts();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/quiz/subjects');
      setTeachers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttempts = async () => {
    try {
      const res = await api.get('/quiz/attempts');
      setAttempts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Student Dashboard</h1>
            <p className="text-slate-600">Welcome, {user?.name}</p>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition">
            Logout
          </button>
        </header>

        <div className="flex gap-4 mb-8 border-b border-slate-200 pb-2">
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'subjects' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
            onClick={() => setActiveTab('subjects')}
          >
            Explore Subjects
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'attempts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
            onClick={() => setActiveTab('attempts')}
          >
            Past Attempts
          </button>
        </div>

        {activeTab === 'subjects' && (
          <div>
            {teachers.length === 0 ? (
              <p className="text-slate-500 bg-white p-8 rounded-xl shadow-sm text-center">No subjects available right now.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {teachers.map(teacher => (
                  <div 
                    key={teacher._id} 
                    onClick={() => navigate(`/student/teacher/${teacher._id}`)}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 transition cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                      </div>
                      <div className="absolute top-0 right-0 flex flex-col items-end gap-1">
                        {teacher.newQuizCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse shadow-sm">
                            {teacher.newQuizCount} New
                          </span>
                        )}
                        {teacher.upcomingQuizCount > 0 && (
                          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                            {teacher.upcomingQuizCount} Upcoming
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-xl text-slate-800 mb-1 capitalize">{teacher.subject || 'General'}</h3>
                      <p className="text-sm text-slate-500 mb-4 lowercase">by prof. {teacher.name}</p>
                    </div>
                    <button className="w-full py-2 bg-slate-50 text-blue-600 font-medium rounded-lg border border-slate-200 group-hover:bg-blue-50 transition">
                      View Quizzes
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'attempts' && (
          <div>
            {attempts.length === 0 ? (
              <p className="text-slate-500 bg-white p-8 rounded-xl shadow-sm text-center">You haven't attempted any quizzes yet.</p>
            ) : (
              <div className="space-y-8">
                {Object.entries(
                  attempts.reduce((acc, attempt) => {
                    const subject = attempt.quizId?.createdBy?.subject || 'General';
                    if (!acc[subject]) acc[subject] = [];
                    acc[subject].push(attempt);
                    return acc;
                  }, {})
                ).map(([subject, subjectAttempts]) => (
                  <div key={subject}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 capitalize border-b border-slate-200 pb-2">{subject}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {subjectAttempts.map(attempt => (
                        <div key={attempt._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-slate-800">{attempt.quizId?.title || 'Unknown Quiz'}</h3>
                            <span className="text-xl font-bold text-blue-600">{attempt.score} / {attempt.resultDetails?.length}</span>
                          </div>
                          <p className="text-xs text-slate-400 mb-4">Completed: {new Date(attempt.createdAt).toLocaleDateString()}</p>
                          <button 
                            onClick={() => navigate(`/quiz-results/${attempt._id}`)}
                            className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition"
                          >
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
