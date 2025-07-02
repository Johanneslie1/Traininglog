import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { usePrograms } from '@/context/ProgramsContext';
import { Exercise, ExerciseSet } from '@/types/exercise';

// Wrapper to fetch program by id and render ProgramDetail
const ProgramDetailWrapper: React.FC = () => {
  const { id } = useParams();
  const { programs, update } = usePrograms();
  const navigate = useNavigate();
  const program = programs.find(p => p.id === id);
  if (!program) return <div className="text-white p-4">Program not found</div>;
  return <ProgramDetail program={program} onBack={() => navigate('/programs')} onUpdate={updated => update(program.id, updated)} />;
};

// Wrapper for program selection mode
const ProgramSelectionWrapper: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { programs } = usePrograms();
  const state = location.state as { onSelect?: (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => void } | null;

  if (!programs.length) {
    return <div className="text-white p-4">No programs found</div>;
  }

  return (
    <ProgramDetail
      program={programs[0]} // Show first program by default
      selectionMode={true}
      onBack={() => navigate('/')}
      onSelectExercises={exercises => {
        if (state?.onSelect) {
          state.onSelect(exercises);
        }
        navigate('/');
      }}
      onUpdate={() => {}} // Dummy update handler for selection mode
    />
  );
};

// Lazy load components
const ExerciseLog = lazy(() => import('@/features/exercises/ExerciseLog'));
const Login = lazy(() => import('@/features/auth/Login'));
const Register = lazy(() => import('@/features/auth/Register'));
const Debug = lazy(() => import('@/features/debug/Debug'));
const ProgramList = lazy(() => import('@/features/programs/ProgramList'));
const ProgramDetail = lazy(() => import('@/features/programs/ProgramDetail'));

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Protected Route wrapper
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  console.log('ProtectedRoute:', { isAuthenticated, isLoading });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-white">Loading authentication...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// App Routes
const AppRoutes: React.FC = () => {
  console.log('AppRoutes rendering');
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    }>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/debug" element={<Debug />} />
        <Route path="/" element={
          <ProtectedRoute>
            <ExerciseLog />
          </ProtectedRoute>
        } />
        <Route path="/programs" element={
          <ProtectedRoute>
            <ProgramList />
          </ProtectedRoute>
        } />
        <Route path="/programs/:id" element={
          <ProtectedRoute>
            <ProgramDetailWrapper />
          </ProtectedRoute>
        } />
        <Route path="/programs/select" element={
          <ProtectedRoute>
            <ProgramSelectionWrapper />
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
