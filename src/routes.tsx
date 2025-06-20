import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

// Lazy load components
const ExerciseLog = lazy(() => import('@/features/exercises/ExerciseLog'));
const Login = lazy(() => import('@/features/auth/Login'));
const Register = lazy(() => import('@/features/auth/Register'));
const Debug = lazy(() => import('@/features/debug/Debug'));

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Protected Route wrapper
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  
  console.log('ProtectedRoute state:', { isAuthenticated, isLoading });
  
  if (isLoading) {
    console.log('Auth is still loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-white">Loading authentication...</div>
      </div>
    );
  }

  console.log('Auth loaded, authenticated:', isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// App Routes
const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    }>      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/debug" element={<Debug />} />
        <Route path="/" element={
          <ProtectedRoute>
            <ExerciseLog />
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
