import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GenerateQuizAI() {
  const navigate = useNavigate();
  const [aiTitle, setAiTitle] = useState('');
  const [file, setFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [aiStartTime, setAiStartTime] = useState('');
  const [aiDuration, setAiDuration] = useState('');
  const [aiDeadline, setAiDeadline] = useState('');
  const [aiTargetGroup, setAiTargetGroup] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState(10);

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
    formData.append('numQuestions', aiNumQuestions);

    try {
      await api.post('/ai/generate-quiz', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/teacher-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating quiz');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/teacher-dashboard')}
          className="mb-6 flex items-center text-slate-600 hover:text-blue-600 transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </button>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Generate Quiz with AI</h1>
              <p className="text-slate-500 mt-1">Upload study material and let AI create the quiz instantly.</p>
            </div>
          </div>
          
          {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

          <form onSubmit={handleAiSubmit} className="space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Number of Questions</label>
                <input 
                  type="number" min="1" max="50" value={aiNumQuestions} onChange={e => setAiNumQuestions(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 10"
                />
              </div>
            </div>
            <div className="pt-4">
              <button 
                type="submit" disabled={isGenerating}
                className={`w-full py-3 rounded-xl text-white font-bold text-lg shadow-sm transition ${isGenerating ? 'bg-slate-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Generating... This may take a minute.
                  </span>
                ) : 'Generate Quiz Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
