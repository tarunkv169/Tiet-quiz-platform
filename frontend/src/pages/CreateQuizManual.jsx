import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CreateQuizManual() {
  const navigate = useNavigate();
  const [manualTitle, setManualTitle] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }
  ]);
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualDuration, setManualDuration] = useState('');
  const [manualDeadline, setManualDeadline] = useState('');
  const [manualTargetGroup, setManualTargetGroup] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/quiz/create-manual', { 
        title: manualTitle, 
        questions,
        scheduledStartTime: manualStartTime ? new Date(manualStartTime).toISOString() : null,
        duration: manualDuration ? parseInt(manualDuration, 10) : null,
        deadline: manualDeadline ? new Date(manualDeadline).toISOString() : null,
        targetGroup: manualTargetGroup || null
      });
      navigate('/teacher-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating quiz');
      setIsSubmitting(false);
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

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/teacher-dashboard')}
          className="mb-6 flex items-center text-slate-600 hover:text-blue-600 transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </button>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-3xl font-bold mb-6 text-slate-800">Create Quiz Manually</h1>
          
          {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

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
            
            <div className="space-y-6 mt-8">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Questions</h2>
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="p-6 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-slate-700 text-lg">Question {qIndex + 1}</h4>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))} className="text-red-500 text-sm font-medium hover:underline">Remove</button>
                    )}
                  </div>
                  <input 
                    type="text" required placeholder="Question text" value={q.question} onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIndex) => (
                      <input 
                        key={oIndex} type="text" required placeholder={`Option ${oIndex + 1}`} value={opt} onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correct Answer (Must match one option exactly)</label>
                    <input 
                      type="text" required value={q.correctAnswer} onChange={e => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Explanation</label>
                    <textarea 
                      required value={q.explanation} onChange={e => updateQuestion(qIndex, 'explanation', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" rows="2"
                    ></textarea>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-4 pt-4 border-t border-slate-200">
              <button 
                type="button" onClick={() => setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }])}
                className="px-4 py-2 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition"
              >
                + Add Question
              </button>
              <button 
                type="submit" disabled={isSubmitting}
                className={`px-8 py-2 text-white font-medium rounded-lg transition ${isSubmitting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isSubmitting ? 'Saving...' : 'Save Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
