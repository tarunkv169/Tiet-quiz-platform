import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TakeQuiz from './pages/TakeQuiz';
import QuizResult from './pages/QuizResult';
import TeacherQuizResults from './pages/TeacherQuizResults';
import TeacherSubjectQuizzes from './pages/TeacherSubjectQuizzes';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (user) {
    return user.role === 'teacher' ? <Navigate to="/teacher-dashboard" /> : <Navigate to="/student-dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans">
          <Routes>
            <Route path="/" element={<PublicRoute><Navigate to="/login" /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            
            <Route 
              path="/teacher-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/student-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/student/teacher/:teacherId" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <TeacherSubjectQuizzes />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/teacher/quiz-results/:id" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherQuizResults />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/quiz/:id" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <TakeQuiz />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/quiz-results/:id" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <QuizResult />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
