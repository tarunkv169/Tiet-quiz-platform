import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function TeacherQuizResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quizRes, resultsRes] = await Promise.all([
        api.get(`/quiz/${id}`),
        api.get(`/quiz/${id}/results`)
      ]);
      setQuiz(quizRes.data);
      setResults(resultsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="bg-red-100 text-red-700 p-6 rounded-xl max-w-lg w-full text-center shadow-sm">
          <p className="text-lg font-semibold">{error}</p>
          <button 
            onClick={() => navigate('/teacher-dashboard')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalAttempts = results.length;
  const maxScore = quiz?.questions?.length || 0;
  
  let averageScore = 0;
  let highestScore = 0;
  let lowestScore = 0;

  if (totalAttempts > 0) {
    const scores = results.map(r => r.score);
    averageScore = (scores.reduce((a, b) => a + b, 0) / totalAttempts).toFixed(1);
    highestScore = Math.max(...scores);
    lowestScore = Math.min(...scores);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/teacher-dashboard')}
          className="mb-6 flex items-center text-slate-600 hover:text-blue-600 transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </button>

        <header className="mb-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{quiz?.title}</h1>
          <p className="text-slate-600">Results Dashboard</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
            <p className="text-slate-500 text-sm font-medium mb-1">Total Attempts</p>
            <p className="text-3xl font-bold text-slate-800">{totalAttempts}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
            <p className="text-slate-500 text-sm font-medium mb-1">Average Score</p>
            <p className="text-3xl font-bold text-blue-600">{averageScore} / {maxScore}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
            <p className="text-slate-500 text-sm font-medium mb-1">Highest Score</p>
            <p className="text-3xl font-bold text-green-600">{highestScore} / {maxScore}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
            <p className="text-slate-500 text-sm font-medium mb-1">Lowest Score</p>
            <p className="text-3xl font-bold text-red-500">{lowestScore} / {maxScore}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">Student Attempts</h2>
          </div>
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No students have attempted this quiz yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Percentage</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Attempted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {results.map((attempt) => (
                    <tr key={attempt._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{attempt.studentId?.name || 'Unknown Student'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {attempt.studentId?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {attempt.score} <span className="text-slate-400 font-normal">/ {maxScore}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const percentage = maxScore > 0 ? Math.round((attempt.score / maxScore) * 100) : 0;
                          let colorClass = 'text-green-600 bg-green-50';
                          if (percentage < 50) colorClass = 'text-red-600 bg-red-50';
                          else if (percentage < 80) colorClass = 'text-yellow-600 bg-yellow-50';
                          
                          return (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                              {percentage}%
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(attempt.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
