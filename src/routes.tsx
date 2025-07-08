import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { usePrograms } from '@/context/ProgramsContext';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { Program } from '@/types/program';

// Wrapper to fetch program by id and render ProgramDetail
const ProgramDetailWrapper: React.FC = () => {
  const { id } = useParams();
  const { programs, updateProgram } = usePrograms();
  const navigate = useNavigate();
  const program = programs.find((p: Program) => p.id === id);
  if (!program) return <div className="text-white p-4">Program not found</div>;
  return <ProgramDetail program={program} onBack={() => navigate('/programs')} onUpdate={updated => updateProgram(program.id, updated)} />;
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
      onUpdate={(updated) => {
        // In selection mode, if exercise selection is made, pass it back through location state
        if (state?.onSelect) {
          // Extract selected exercises from the updated program
          const selectedExercises = updated.sessions.flatMap(s => 
            s.exercises.map(e => ({
              exercise: {
                id: e.id,
                name: e.name,
                description: '', // Required by Exercise type
                type: 'strength',
                category: 'compound',
                primaryMuscles: [],
                secondaryMuscles: [],
                instructions: [],
                defaultUnit: 'kg',
                metrics: {
                  trackWeight: true,
                  trackReps: true
                }
              } as Exercise,
              sets: e.setsData || []
            }))
          );
          state.onSelect(selectedExercises);
        }
        navigate('/');
      }}
    />
  );
};

// Lazy load components
const Login = lazy(() => import('@/features/auth/Login'));
const Register = lazy(() => import('@/features/auth/Register'));
const ExerciseLog = lazy(() => import('@/features/exercises/ExerciseLog'));
const ProgramList = lazy(() => import('@/features/programs/ProgramList'));
const ProgramDetail = lazy(() => import('@/features/programs/ProgramDetail'));
const Debug = lazy(() => import('@/features/debug/Debug'));
const ExerciseOverview = lazy(() => import('@/pages/ExerciseOverview'));

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
        <div className="ml-3 text-white">Loading...</div>
      </div>
    }>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ExerciseLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/programs"
          element={
            <ProtectedRoute>
              <ProgramList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/programs/:id"
          element={
            <ProtectedRoute>
              <ProgramDetailWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/program-selection"
          element={
            <ProtectedRoute>
              <ProgramSelectionWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/debug"
          element={
            <ProtectedRoute>
              <Debug />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercises"
          element={
            <ProtectedRoute>
              <ExerciseOverview />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
