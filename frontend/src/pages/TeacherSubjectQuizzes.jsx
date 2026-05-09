import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) return 'Starting... (Refresh)';
      
      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const m = Math.floor((difference / 1000 / 60) % 60);
      const s = Math.floor((difference / 1000) % 60);
      
      return `${d > 0 ? d + 'd ' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <span className="font-mono bg-orange-100 text-orange-700 px-2 py-0.5 rounded ml-2 text-sm font-bold shadow-sm border border-orange-200 inline-block">
      ⏱ {timeLeft}
    </span>
  );
};

export default function TeacherSubjectQuizzes() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, [teacherId]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quiz/teacher/${teacherId}`);
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const teacher = quizzes.length > 0 ? quizzes[0].createdBy : null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/student-dashboard')}
          className="mb-6 flex items-center text-slate-600 hover:text-blue-600 transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </button>

        <header className="mb-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 capitalize">
            {teacher ? `${teacher.subject || 'General'} Quizzes` : 'Subject Quizzes'}
          </h1>
          <p className="text-slate-600 lowercase">
            {teacher ? `by prof. ${teacher.name}` : '...'}
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : quizzes.length === 0 ? (
          <p className="text-slate-500 bg-white p-8 rounded-xl shadow-sm text-center">No quizzes available for this subject right now.</p>
        ) : (
          <div className="space-y-12">
            {/* New Quizzes Section */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <span className="bg-blue-600 w-2 h-6 rounded-full mr-3"></span>
                New Quizzes
              </h2>
              {(() => {
                const newQuizzes = quizzes.filter(q => {
                  if (q.hasAttempted) return false;
                  if (q.scheduledStartTime && new Date() < new Date(q.scheduledStartTime)) return false;
                  if (q.deadline && new Date() > new Date(q.deadline)) return false;
                  return true;
                });
                
                if (newQuizzes.length === 0) {
                  return <p className="text-slate-500 bg-white p-6 rounded-xl shadow-sm text-center italic">No new quizzes available.</p>;
                }

                return (
                  <div className="flex flex-col space-y-4">
                    {newQuizzes.map(quiz => {
                      let buttonText = 'Start Quiz';
                      if (quiz.duration) buttonText += ` (${quiz.duration} mins)`;

                      return (
                        <div key={quiz._id} className="bg-white p-6 rounded-xl shadow-sm border-2 border-blue-100 hover:border-blue-400 hover:shadow-md transition flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">New</div>
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-slate-800 mb-2 mt-2">{quiz.title}</h3>
                            <div className="flex flex-wrap gap-2 mb-2 md:mb-0">
                              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                                {quiz.questions?.length} Questions
                              </span>
                              {quiz.deadline && (
                                <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full">
                                  Due: {new Date(quiz.deadline).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => navigate(`/quiz/${quiz._id}`)}
                            className="w-full md:w-auto px-8 py-2 mt-4 md:mt-0 rounded-lg font-medium transition bg-blue-600 text-white hover:bg-blue-700"
                          >
                            {buttonText}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>

            {/* Upcoming Quizzes Section */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <span className="bg-orange-500 w-2 h-6 rounded-full mr-3"></span>
                Upcoming Quizzes
              </h2>
              {(() => {
                const upcomingQuizzes = quizzes.filter(q => {
                  if (q.hasAttempted) return false;
                  if (q.scheduledStartTime && new Date() < new Date(q.scheduledStartTime)) return true;
                  return false;
                });
                
                if (upcomingQuizzes.length === 0) {
                  return null; // Don't show if empty
                }

                return (
                  <div className="flex flex-col space-y-4">
                    {upcomingQuizzes.map(quiz => {
                      return (
                        <div key={quiz._id} className="bg-white p-6 rounded-xl shadow-sm border border-orange-200 hover:shadow-md transition flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Upcoming</div>
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-slate-800 mb-2 mt-2">{quiz.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-0">
                              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                                {quiz.questions?.length} Questions
                              </span>
                              <span className="inline-flex items-center text-sm font-medium text-slate-600">
                                Starts in: <CountdownTimer targetDate={quiz.scheduledStartTime} />
                              </span>
                            </div>
                          </div>
                          <button 
                            disabled
                            className="w-full md:w-auto px-8 py-2 mt-4 md:mt-0 rounded-lg font-medium transition bg-slate-100 text-slate-400 cursor-not-allowed"
                          >
                            Wait for Start
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>

            {/* Past/Occurred Quizzes Section */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <span className="bg-slate-400 w-2 h-6 rounded-full mr-3"></span>
                Past Quizzes
              </h2>
              {(() => {
                const pastQuizzes = quizzes.filter(q => {
                  if (q.hasAttempted) return true;
                  if (q.scheduledStartTime && new Date() < new Date(q.scheduledStartTime)) return false; // Handled in upcoming
                  if (q.deadline && new Date() > new Date(q.deadline)) return true;
                  return false;
                });
                
                if (pastQuizzes.length === 0) {
                  return <p className="text-slate-500 bg-white p-6 rounded-xl shadow-sm text-center italic">No past quizzes available.</p>;
                }

                return (
                  <div className="flex flex-col space-y-4">
                    {pastQuizzes.map(quiz => {
                      const isFuture = quiz.scheduledStartTime && new Date() < new Date(quiz.scheduledStartTime);
                      const isExpired = quiz.deadline && new Date() > new Date(quiz.deadline);
                      const isAttempted = quiz.hasAttempted;
                      
                      let buttonText = 'Unavailable';
                      if (isAttempted) buttonText = 'Already Attempted';
                      else if (isFuture) buttonText = `Starts at ${new Date(quiz.scheduledStartTime).toLocaleString()}`;
                      else if (isExpired) buttonText = 'Deadline Passed';

                      return (
                        <div key={quiz._id} className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center opacity-80">
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-slate-600 mb-2">{quiz.title}</h3>
                            <div className="flex flex-wrap gap-2 mb-2 md:mb-0">
                              <span className="inline-block px-3 py-1 bg-slate-200 text-slate-600 text-xs font-semibold rounded-full">
                                {quiz.questions?.length} Questions
                              </span>
                              {quiz.deadline && (
                                <span className="inline-block px-3 py-1 bg-slate-200 text-slate-600 text-xs font-semibold rounded-full">
                                  Deadline was: {new Date(quiz.deadline).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            disabled
                            className="w-full md:w-auto px-8 py-2 mt-4 md:mt-0 rounded-lg font-medium bg-slate-200 text-slate-500 cursor-not-allowed"
                          >
                            {buttonText}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
