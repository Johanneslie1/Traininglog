import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useCollection } from '@/hooks/useCollection';
import { db } from '@/services/firebase/config';
import { collection, query, where, orderBy, QueryConstraint, limit } from 'firebase/firestore';
import type { Exercise } from '@/types/exercise';
import type { ExerciseLog } from '@/types/exercise';
import { CreateUniversalExerciseDialog } from '@/components/exercises/CreateUniversalExerciseDialog';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { deleteCustomExerciseById } from '@/services/customExerciseCreationService';
import { format } from 'date-fns';
import { EmptyState } from '@/components/ui';
interface FilterState {
  search: string;
  category: string[];
  type: 'all' | 'default' | 'custom';
}

const ExerciseOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: [],
    type: 'all'
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined);
  const [showHistory, setShowHistory] = useState(true);

  // Get URL search params to check if we should show create dialog
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  useEffect(() => {
    if (searchParams.get('showCreate') === 'true') {
      setShowCreateDialog(true);
    }
  }, [searchParams]);

  // Fetch exercises
  const queryConstraints: QueryConstraint[] = [];

  if (filters.type === 'custom' && user) {
    queryConstraints.push(where('userId', '==', user.id));
  } else if (filters.type === 'default') {
    queryConstraints.push(where('userId', '==', null));
  }
  queryConstraints.push(orderBy('name'));

  const exercisesQuery = query(
    collection(db, 'exercises'),
    ...queryConstraints
  );

  const { documents: exercises, loading, error } = useCollection<Exercise>(exercisesQuery);

  // Fetch recent exercise history for quick-add panel
  const recentLogsQuery = query(
    collection(db, 'users', user?.id ?? '__none__', 'exercises'),
    orderBy('timestamp', 'desc'),
    limit(8)
  );
  const { documents: recentLogs } = useCollection<ExerciseLog>(recentLogsQuery);

  // Filter exercises based on search and category
  // Filter exercises based on search and category
  const filteredExercises = exercises?.filter((exercise: Exercise) => {
    if (!exercise) return false;
    
    const matchesSearch = exercise.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesCategory = filters.category.length === 0 || 
      (exercise.category && filters.category.includes(exercise.category));

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = exercises
    ? [...new Set(exercises.filter((ex: Exercise) => ex && ex.category).map((ex: Exercise) => ex.category))]
    : [];

  const handleEditCustomExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setShowCreateDialog(true);
  };

  const handleDeleteCustomExercise = async (exercise: Exercise) => {
    if (!user?.id || !exercise.id) {
      return;
    }

    const confirmed = window.confirm(`Delete custom activity "${exercise.name}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomExerciseById(exercise.id, user.id);
      toast.success('Custom activity deleted.');
    } catch (deleteError) {
      console.error('Error deleting custom exercise:', deleteError);
      toast.error('Failed to delete custom activity.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Exercise Library</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="bg-bg-secondary text-text-secondary px-3 py-2 rounded-lg hover:bg-bg-tertiary border border-border text-sm"
          >
            Today's Log
          </button>
          <button
            onClick={() => {
              setEditingExercise(undefined);
              setShowCreateDialog(true);
            }}
            className="bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-primary/90"
          >
            Create Exercise
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {recentLogs && recentLogs.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-bg-secondary">
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold text-text-primary uppercase tracking-wide">Recent Activity</span>
            <span className="text-text-secondary text-xs">{showHistory ? '▲ hide' : '▼ show'}</span>
          </button>
          {showHistory && (
            <div className="px-4 pb-4 space-y-2">
              {recentLogs.map((log) => {
                const setCount = Array.isArray(log.sets) ? log.sets.length : 0;
                const firstSet = log.sets?.[0];
                const summary = setCount > 0
                  ? (firstSet?.weight ? `${setCount} × ${String(firstSet.reps ?? '')} @ ${String(firstSet.weight)}kg` : `${setCount} set${setCount !== 1 ? 's' : ''}`)
                  : 'No sets logged';
                const dateStr = log.timestamp
                  ? format(new Date(log.timestamp), 'MMM d')
                  : '';
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{log.exerciseName}</p>
                      <p className="text-xs text-text-secondary">{summary}{dateStr ? ` · ${dateStr}` : ''}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="ml-3 shrink-0 text-xs font-medium text-accent-primary hover:underline"
                    >
                      Log today
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search exercises..."
            className="flex-1 px-4 py-2 rounded-lg bg-bg-secondary text-text-primary border border-border"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <select
            className="px-4 py-2 rounded-lg bg-bg-secondary text-text-primary border border-border"
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as FilterState['type'] }))}
          >
            <option value="all">All Exercises</option>
            <option value="default">Default Exercises</option>
            <option value="custom">Custom Exercises</option>
          </select>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category as string}
              onClick={() => setFilters(prev => ({
                ...prev,
                category: prev.category.includes(category as string)
                  ? prev.category.filter(c => c !== category)
                  : [...prev.category, category as string]
              }))}
              className={`px-3 py-1 rounded-full text-sm ${
                filters.category.includes(category as string)
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary text-text-secondary border border-border'
              }`}
            >
              {category as string}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent-primary mx-auto"></div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center py-8">
          Error loading exercises: {error.message}
        </div>
      )}

      {!loading && !error && filteredExercises?.length === 0 && (
        <EmptyState
          illustration={filters.search || filters.category.length > 0 ? 'search' : 'workout'}
          title={filters.search || filters.category.length > 0 ? 'No exercises match your filters' : 'No exercises yet'}
          description={
            filters.search || filters.category.length > 0
              ? 'Try a different search term or clear the active filters.'
              : 'Create your first custom exercise to get started.'
          }
          primaryAction={
            filters.search || filters.category.length > 0
              ? { label: 'Clear Filters', onClick: () => setFilters({ search: '', category: [], type: 'all' }) }
              : { label: 'Create Exercise', onClick: () => { setEditingExercise(undefined); setShowCreateDialog(true); } }
          }
        />
      )}

      {!loading && !error && (filteredExercises?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises?.map((exercise: Exercise) => (
            <div
              key={exercise.id || ''}
              className="p-4 rounded-lg bg-bg-secondary border border-border hover:border-accent-primary transition-colors"
            >
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {exercise.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                <span className="px-2 py-0.5 rounded-full bg-bg-primary">
                  {exercise.category}
                </span>
                {exercise.userId ? (
                  <span className="px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary">
                    Custom
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                    Default
                  </span>
                )}
              </div>
              {exercise.description && (
                <p className="text-sm text-text-secondary line-clamp-2">
                  {exercise.description}
                </p>
              )}
              {exercise.userId && (
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleEditCustomExercise(exercise)}
                    className="text-sm font-medium text-accent-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomExercise(exercise)}
                    className="text-sm font-medium text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Exercise Dialog */}
      {showCreateDialog && (
        <CreateUniversalExerciseDialog
          onClose={() => {
            setShowCreateDialog(false);
            setEditingExercise(undefined);
          }}
          onSuccess={() => {
            setShowCreateDialog(false);
            setEditingExercise(undefined);
            // Exercises will automatically refresh due to useCollection hook
          }}
          initialExercise={editingExercise}
        />
      )}
    </div>
  );
};

export default ExerciseOverview;
