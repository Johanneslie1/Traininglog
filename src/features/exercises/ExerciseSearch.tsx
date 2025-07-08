import React, { useState } from 'react';
import { allExercises } from '@/data/exercises';
import { importedExercises } from '@/data/importedExercises';
import { Category } from './CategoryButton';
import { CreateExerciseDialog } from '@/components/exercises/CreateExerciseDialog';

// Combine both exercise lists
const combinedExercises = [...allExercises, ...importedExercises.map(ex => ({
  ...ex,
  id: `imported-${ex.name.replace(/\s+/g, '-').toLowerCase()}`  // Create a pseudo-id
}))];

interface ExerciseSearchProps {
  onClose: () => void;
  onSelectExercise: (exercise: typeof combinedExercises[0]) => void;
  category?: Category | null;
}

export const ExerciseSearch: React.FC<ExerciseSearchProps> = ({ 
  onClose, 
  onSelectExercise,
  category 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const matchesCategory = (exercise: typeof combinedExercises[0], categoryId: string): boolean => {
    const primaryMuscles = Array.isArray(exercise.primaryMuscles) 
      ? exercise.primaryMuscles 
      : [exercise.primaryMuscles];
    
    switch (categoryId) {
      case 'chest':
        return primaryMuscles.some(m => ['chest', 'pectorals'].includes(String(m).toLowerCase()));
      case 'back':
        return primaryMuscles.some(m => ['back', 'lats', 'traps'].includes(String(m).toLowerCase()));
      case 'legs':
        return primaryMuscles.some(m => ['quadriceps', 'hamstrings', 'calves', 'glutes'].includes(String(m).toLowerCase()));
      case 'shoulders':
        return primaryMuscles.some(m => ['shoulders', 'deltoids'].includes(String(m).toLowerCase()));
      case 'arms':
        return primaryMuscles.some(m => ['biceps', 'triceps', 'forearms'].includes(String(m).toLowerCase()));
      case 'core':
        return primaryMuscles.some(m => ['core', 'abs', 'abdominals'].includes(String(m).toLowerCase()));
      case 'fullBody':
        return exercise.category === 'compound' || primaryMuscles.length > 2;
      case 'cardio':
        return exercise.type === 'cardio';
      case 'stretching':
        return exercise.type === 'flexibility';
      default:
        return true;
    }
  };

  const filteredExercises = combinedExercises.filter(exercise => {
    const matchesSearch = searchTerm === '' || 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(exercise.primaryMuscles) && 
        exercise.primaryMuscles.some(m => 
          String(m).toLowerCase().includes(searchTerm.toLowerCase())
        ));

    const categoryMatch = !category || matchesCategory(exercise, category.id);

    return matchesSearch && categoryMatch;
  });

  const handleCreateExercise = () => {
    setShowCreateDialog(true);
  };

  const handleExerciseCreated = async (exerciseId: string) => {
    // TODO: Fetch the newly created exercise from Firebase and select it
    setShowCreateDialog(false);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#2a2a2a]">
        <div className="flex items-center p-4">
          <button
            onClick={onClose}
            className="mr-4 p-2 rounded-full hover:bg-[#2a2a2a] transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-grow">
            <input
              autoFocus
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${category ? category.name.toLowerCase() : 'exercises'}...`}
              className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-xl border border-[#2a2a2a] focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto pb-safe">
        <div className="p-4 space-y-2">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise, index) => (
              <button
                key={`exercise-${exercise.name}-${index}`}
                onClick={() => onSelectExercise(exercise)}
                className="w-full text-left p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#222] transition-colors"
              >
                <h3 className="text-white font-medium">{exercise.name}</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {Array.isArray(exercise.primaryMuscles) 
                    ? exercise.primaryMuscles.join(', ') 
                    : exercise.primaryMuscles}
                </p>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 space-y-4">
              <div className="text-center">
                <p className="text-white/60 text-lg mb-2">No exercises found</p>
                <p className="text-white/40">Can't find what you're looking for?</p>
              </div>
              <button
                onClick={handleCreateExercise}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors min-h-[44px]"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Create New Exercise
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Exercise Dialog */}
      {showCreateDialog && (
        <CreateExerciseDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleExerciseCreated}
        />
      )}
    </div>
  );
};

export default ExerciseSearch;
