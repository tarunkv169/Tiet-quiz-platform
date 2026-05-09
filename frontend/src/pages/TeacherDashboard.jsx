import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);

  // Manual Quiz Form State
  const [manualTitle, setManualTitle] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }
  ]);
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualDuration, setManualDuration] = useState('');
  const [manualDeadline, setManualDeadline] = useState('');
  const [manualTargetGroup, setManualTargetGroup] = useState('');

  // AI Quiz Form State
  const [aiTitle, setAiTitle] = useState('');
  const [file, setFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [aiStartTime, setAiStartTime] = useState('');
  const [aiDuration, setAiDuration] = useState('');
  const [aiDeadline, setAiDeadline] = useState('');
  const [aiTargetGroup, setAiTargetGroup] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await api.get('/quiz/teacher');
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
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

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/quiz/create-manual', { 
        title: manualTitle, 
        questions,
        scheduledStartTime: manualStartTime ? new Date(manualStartTime).toISOString() : null,
        duration: manualDuration ? parseInt(manualDuration, 10) : null,
        deadline: manualDeadline ? new Date(manualDeadline).toISOString() : null,
        targetGroup: manualTargetGroup || null
      });
      setShowManualForm(false);
      setManualTitle('');
      setManualStartTime('');
      setManualDuration('');
      setManualDeadline('');
      setManualTargetGroup('');
      setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }]);
      fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating quiz');
    }
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a file');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    const formData = new FormData();
    formData.append('title', aiTitle);
    formData.append('document', file);
    if (aiStartTime) formData.append('scheduledStartTime', new Date(aiStartTime).toISOString());
    if (aiDuration) formData.append('duration', parseInt(aiDuration, 10));
    if (aiDeadline) formData.append('deadline', new Date(aiDeadline).toISOString());
    if (aiTargetGroup) formData.append('targetGroup', aiTargetGroup);

    try {
      await api.post('/ai/generate-quiz', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowAiForm(false);
      setAiTitle('');
      setAiStartTime('');
      setAiDuration('');
      setAiDeadline('');
      setAiTargetGroup('');
      setFile(null);
      fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
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
            onClick={() => { setShowManualForm(!showManualForm); setShowAiForm(false); }}
            className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition text-left"
          >
            <h3 className="text-xl font-semibold text-slate-800">Create Quiz Manually</h3>
            <p className="text-slate-500 mt-2">Add your own questions, options, and explanations.</p>
          </button>
          
          <button 
            onClick={() => { setShowAiForm(!showAiForm); setShowManualForm(false); }}
            className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 hover:border-blue-500 hover:shadow-md transition text-left"
          >
            <h3 className="text-xl font-semibold text-blue-900">Generate with AI (Upload Material)</h3>
            <p className="text-blue-700 mt-2">Upload a PDF or Text file and let Gemini AI create a quiz for you instantly.</p>
          </button>
        </div>

        {/* AI Generation Form */}
        {showAiForm && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-slate-800">Generate Quiz with AI</h2>
            <form onSubmit={handleAiSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title</label>
                <input 
                  type="text" required value={aiTitle} onChange={e => setAiTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Introduction to React"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Study Material (PDF/TXT)</label>
                <input 
                  type="file" accept=".pdf,.txt" required onChange={e => setFile(e.target.files[0])}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Group Code (Optional)</label>
                  <input 
                    type="text" value={aiTargetGroup} onChange={e => setAiTargetGroup(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. GRP-101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deadline Time (Optional)</label>
                  <input 
                    type="datetime-local" value={aiDeadline} onChange={e => setAiDeadline(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Start Time (Optional)</label>
                  <input 
                    type="datetime-local" value={aiStartTime} onChange={e => setAiStartTime(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration in minutes (Optional)</label>
                  <input 
                    type="number" min="1" value={aiDuration} onChange={e => setAiDuration(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 30"
                  />
                </div>
              </div>
              <button 
                type="submit" disabled={isGenerating}
                className={`px-6 py-2 rounded-lg text-white font-medium ${isGenerating ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isGenerating ? 'Generating... This may take a minute.' : 'Generate Quiz'}
              </button>
            </form>
          </div>
        )}

        {/* Manual Form */}
        {showManualForm && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-slate-800">Create Quiz Manually</h2>
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title</label>
                <input 
                  type="text" required value={manualTitle} onChange={e => setManualTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Group Code (Optional)</label>
                  <input 
                    type="text" value={manualTargetGroup} onChange={e => setManualTargetGroup(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. GRP-101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deadline Time (Optional)</label>
                  <input 
                    type="datetime-local" value={manualDeadline} onChange={e => setManualDeadline(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Start Time (Optional)</label>
                  <input 
                    type="datetime-local" value={manualStartTime} onChange={e => setManualStartTime(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration in minutes (Optional)</label>
                  <input 
                    type="number" min="1" value={manualDuration} onChange={e => setManualDuration(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 30"
                  />
                </div>
              </div>
              
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-slate-700">Question {qIndex + 1}</h4>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))} className="text-red-500 text-sm hover:underline">Remove</button>
                    )}
                  </div>
                  <input 
                    type="text" required placeholder="Question text" value={q.question} onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIndex) => (
                      <input 
                        key={oIndex} type="text" required placeholder={`Option ${oIndex + 1}`} value={opt} onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correct Answer (Must match one option exactly)</label>
                    <input 
                      type="text" required value={q.correctAnswer} onChange={e => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Explanation</label>
                    <textarea 
                      required value={q.explanation} onChange={e => updateQuestion(qIndex, 'explanation', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md" rows="2"
                    ></textarea>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-4">
                <button 
                  type="button" onClick={() => setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }])}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                >
                  + Add Question
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Save Quiz
                </button>
              </div>
            </form>
          </div>
        )}

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
