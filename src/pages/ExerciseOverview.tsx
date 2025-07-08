import React, { useState } from 'react';
import { useCollection } from '@/hooks/useCollection';
import { db } from '@/services/firebase/config';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Exercise } from '@/types/exercise';
import { CreateExerciseDialog } from '@/components/exercises/CreateExerciseDialog';
import { useAuth } from '@/hooks/useAuth';
import { User } from 'firebase/auth';

interface FilterState {
  search: string;
  category: string[];
  type: 'all' | 'default' | 'custom';
}

const ExerciseOverview: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: [],
    type: 'all'
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch exercises
  const exercisesQuery = query(
    collection(db, 'exercises'),
    ...(filters.type === 'custom' ? [where('userId', '==', user?.id)] : []),
    ...(filters.type === 'default' ? [where('userId', '==', null)] : []),
    orderBy('name')
  );

  const { documents: exercises, loading, error } = useCollection<Exercise>(exercisesQuery);

  // Filter exercises based on search and category
  const filteredExercises = exercises?.filter((exercise: Exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesCategory = filters.category.length === 0 || 
      filters.category.includes(exercise.category);

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(exercises?.map((ex: Exercise) => ex.category) || [])];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Exercise Library</h1>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-primary/90"
        >
          Create Exercise
        </button>
      </div>

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

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises?.map(exercise => (
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
            </div>
          ))}
        </div>
      )}

      {/* Create Exercise Dialog */}
      {showCreateDialog && (
        <CreateExerciseDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            // Exercises will automatically refresh due to useCollection hook
          }}
        />
      )}
    </div>
  );
};

export default ExerciseOverview;
