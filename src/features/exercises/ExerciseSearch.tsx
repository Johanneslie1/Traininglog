import React, { useState } from 'react';
import { allExercises } from '@/data/exercises';
import { importedExercises } from '@/data/importedExercises';

// Combine both exercise lists
const combinedExercises = [...allExercises, ...importedExercises.map(ex => ({
  ...ex,
  id: `imported-${ex.name.replace(/\s+/g, '-').toLowerCase()}`  // Create a pseudo-id
}))];

interface Category {
  id: string;
  name: string;
  icon: string;
  bgColor: string;
  iconBgColor: string;
  textColor: string;
}

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
  const [showSearch, setShowSearch] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-[#2d2d2d]">
        {showSearch ? (
          <div className="flex w-full items-center">
            <input
              autoFocus
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search exercises..."
              className="flex-grow bg-[#2a2a2a] text-white px-4 py-2 rounded-lg border border-[#3d3d3d] focus:outline-none focus:border-[#8B5CF6]"
            />
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchTerm('');
              }}
              className="ml-2 p-2 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center flex-grow">
              <button
                onClick={onClose}
                className="mr-4 text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-white text-xl">
                {category ? category.name : 'All Exercises'}
              </h1>
            </div>
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Exercise List */}
      <div className="overflow-y-auto h-[calc(100vh-64px)]">
        {filteredExercises.map((exercise) => (
          <button
            key={`exercise-${exercise.name}`}
            onClick={() => onSelectExercise(exercise)}
            className="w-full text-left p-4 border-b border-[#2d2d2d] text-white hover:bg-[#2a2a2a]"
          >
            <div className="font-medium">{exercise.name}</div>
            <div className="text-sm text-gray-400">
              {Array.isArray(exercise.primaryMuscles) 
                ? exercise.primaryMuscles.join(', ') 
                : exercise.primaryMuscles}
            </div>
          </button>
        ))}

        {filteredExercises.length === 0 && (
          <div className="p-4 text-center text-gray-400">
            No exercises found. Try adjusting your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseSearch;
