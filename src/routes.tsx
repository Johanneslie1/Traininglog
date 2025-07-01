import React, { Suspense, lazy } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { usePrograms } from '@/context/ProgramsContext';
// Wrapper to fetch program by id and render ProgramDetail
const ProgramDetailWrapper: React.FC = () => {
  const { id } = useParams();
  const { programs, update } = usePrograms();
  const navigate = useNavigate();
  const program = programs.find(p => p.id === id);
  if (!program) return <div className="text-white p-4">Program not found</div>;
  return <ProgramDetail program={program} onBack={() => navigate('/programs')} onUpdate={updated => update(program.id, updated)} />;
};

// Lazy load components
const ExerciseLog = lazy(() => import('./features/exercises/ExerciseLog'));

const Debug = lazy(() => import('@/features/debug/Debug'));
const ProgramList = lazy(() => import('@/features/programs/ProgramList'));
const ProgramDetail = lazy(() => import('@/features/programs/ProgramDetail'));

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Protected Route wrapper (no authentication, always allow)
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <>{children}</>;
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
*** End Patch
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
