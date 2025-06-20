import React, { useState } from 'react';
import { allExercises } from '@/data/exercises';
import { importedExercises } from '@/data/importedExercises';

// Combine both exercise lists
const combinedExercises = [...allExercises, ...importedExercises.map(ex => ({
  ...ex,
  id: `imported-${ex.name.replace(/\s+/g, '-').toLowerCase()}`  // Create a pseudo-id
}))];

// For debugging - Log the count of imported exercises
console.log(`Total combined exercises: ${combinedExercises.length}`);
console.log(`Imported exercises count: ${importedExercises.length}`);
console.log(`Default exercises count: ${allExercises.length}`);

// Log a sample of 5 imported exercises for debugging
if (importedExercises.length > 0) {
  console.log('Sample imported exercises:');
  importedExercises.slice(0, 5).forEach(ex => {
    console.log(`Name: ${ex.name}, Category: ${ex.category}, Type: ${ex.type}, Muscles: ${Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles.join(', ') : ex.primaryMuscles}`);
  });
}

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
}) => {  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);  const filteredExercises = combinedExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Helper function to check if a string contains any of the keywords
    const containsKeywords = (target: string, keywords: string[]): boolean => {
      const targetLower = target.toLowerCase();
      return keywords.some(keyword => targetLower.includes(keyword.toLowerCase()));
    };

    // Helper function to check if primary muscles match category
    const primaryMusclesMatch = (primaryMuscles: string[] | string | undefined, keywords: string[]): boolean => {
      if (!primaryMuscles) return false;
      
      if (Array.isArray(primaryMuscles)) {
        return primaryMuscles.some(muscle => containsKeywords(String(muscle), keywords));
      }
      
      if (typeof primaryMuscles === 'string') {
        return containsKeywords(primaryMuscles, keywords);
      }
      
      return false;
    };
    
    const matchesCategory = category ? (() => {
      // Log the category we're filtering by for debugging
      console.log(`Filtering by category: ${category.id} (${category.name})`);
      
      // Map UI category IDs to exercise primaryMuscles and types
      switch (category.id) {
        case 'chest':
          return primaryMusclesMatch(exercise.primaryMuscles, ['chest', 'pectoral', 'pec']);
        case 'back':
          return primaryMusclesMatch(exercise.primaryMuscles, ['back', 'lat', 'trapezius', 'rhomboid']);
        case 'legs':
          return primaryMusclesMatch(exercise.primaryMuscles, ['quad', 'glute', 'ham', 'leg', 'calv', 'thigh']);
        case 'shoulders':
          return primaryMusclesMatch(exercise.primaryMuscles, ['shoulder', 'delt']);
        case 'arms':
          return primaryMusclesMatch(exercise.primaryMuscles, ['bicep', 'tricep', 'arm', 'forearm']);
        case 'core':
          return primaryMusclesMatch(exercise.primaryMuscles, ['ab', 'core', 'abdominal']);
        case 'fullBody':
          return exercise.category === 'compound' || 
                (Array.isArray(exercise.primaryMuscles) && exercise.primaryMuscles.length > 2);
        case 'cardio':
          return exercise.type === 'cardio' || exercise.category === 'cardio';
        case 'stretching':
          return exercise.type === 'flexibility' || exercise.category === 'stretching';        case 'agility':
        case 'speed':
          return exercise.type === 'cardio' || exercise.category === 'cardio' || 
                exercise.type.toLowerCase().includes('plyometric');
        default:
          return (
            (Array.isArray(exercise.primaryMuscles) && exercise.primaryMuscles.some(m => 
              String(m).toLowerCase().includes(category.id.toLowerCase()))) || 
            exercise.type === category.id ||
            exercise.category === category.id
          );
      }
    })() : true;
    
    return matchesSearch && matchesCategory;
  });
  return (
    <div className="fixed inset-0 bg-gymkeeper-dark">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gymkeeper-purple-darker">
        {showSearch ? (
          <div className="flex w-full items-center">
            <input
              autoFocus
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search exercises..."
              className="flex-grow bg-gymkeeper-light text-white px-4 py-2 rounded-lg"
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
                {category ? category.name : 'Exercises'}
              </h1>
            </div>
            <button              onClick={() => setShowSearch(true)}
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
            key={exercise.name}
            onClick={() => onSelectExercise(exercise)}
            className="w-full text-left p-4 border-b border-gymkeeper-purple-darker text-white hover:bg-gymkeeper-light"
          >
            <div className="font-medium">{exercise.name}</div>
            <div className="text-sm text-gray-400">
              {exercise.primaryMuscles.join(', ')}
            </div>
          </button>
        ))}

        {filteredExercises.length === 0 && (
          <div className="p-4 text-center text-gray-400">
            No exercises found
          </div>
        )}
        {/* Add indication about imported exercises */}
        {filteredExercises.length > 0 && (
          <div className="p-4 text-center text-primary-500">
            Showing {filteredExercises.length} exercises 
            (including imported exercises)
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseSearch;
