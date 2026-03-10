import React, { useState, useEffect } from 'react';
import { allExercises } from '@/data/exercises';
import { importedExercises } from '@/data/importedExercises';
import { Exercise, MuscleGroup } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { DifficultyCategory } from '@/types/difficulty';
import { toast } from 'react-hot-toast';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { SearchIcon, XIcon } from '@heroicons/react/outline';
import AppOverlay from '@/components/ui/AppOverlay';

interface ExerciseDatabasePickerProps {
  onClose: () => void;
  onSelectExercises: (exercises: Array<{ exercise: Exercise; sets: ExerciseSet[] }>) => void;
}

const normalizeMuscle = (muscle: string): MuscleGroup => {
  const muscleMap: Record<string, MuscleGroup> = {
    'chest': 'chest',
    'pectorals': 'chest',
    'back': 'back',
    'lats': 'lats',
    'traps': 'traps',
    'shoulders': 'shoulders',
    'deltoids': 'shoulders',
    'biceps': 'biceps',
    'triceps': 'triceps',
    'forearms': 'forearms',
    'legs': 'quadriceps',
    'quadriceps': 'quadriceps',
    'hip flexors': 'hip_flexors',
    'hip_flexors': 'hip_flexors',
    'hamstrings': 'hamstrings',
    'calves': 'calves',
    'glutes': 'glutes',
    'core': 'core',
    'abs': 'core',
    'abdominals': 'core',
    'lower back': 'lower_back',
    'full body': 'full_body'
  };

  const normalized = muscleMap[muscle.toLowerCase()];
  return normalized || 'full_body';
};

const ExerciseDatabasePicker: React.FC<ExerciseDatabasePickerProps> = ({
  onClose,
  onSelectExercises
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [combinedExercises, setCombinedExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

  const categories = [
    { id: '', name: 'All', icon: '💪' },
    { id: 'chest', name: 'Chest', icon: '🫀' },
    { id: 'back', name: 'Back', icon: '🔙' },
    { id: 'legs', name: 'Legs', icon: '🦵' },
    { id: 'shoulders', name: 'Shoulders', icon: '💪' },
    { id: 'arms', name: 'Arms', icon: '💪' },
    { id: 'core', name: 'Core', icon: '🎯' },
  ];

  // Load custom exercises from Firebase
  useEffect(() => {
    const loadCustomExercises = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const exercisesRef = collection(db, 'exercises');
        const q = query(exercisesRef, where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        const exercises: Exercise[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          exercises.push({
            ...data,
            id: doc.id,
            primaryMuscles: data.primaryMuscles.map(normalizeMuscle),
            type: data.type as Exercise['type'],
            category: data.category as Exercise['category'],
            defaultUnit: data.defaultUnit as Exercise['defaultUnit']
          } as Exercise);
        });
        
        setCustomExercises(exercises);
      } catch (error) {
        console.error('Error loading custom exercises:', error);
        toast.error('Failed to load custom exercises');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomExercises();
  }, [user]);

  // Combine exercises whenever custom exercises change
  useEffect(() => {
    const normalizedExercises: Exercise[] = [
      ...allExercises.map(ex => ({
        ...ex,
        // Use consistent ID format for default exercises - these IDs are used as database references
        id: `default-${ex.name.replace(/\s+/g, '-').toLowerCase()}`,
        primaryMuscles: (ex.primaryMuscles || []).map(normalizeMuscle),
        secondaryMuscles: [],
        customExercise: false
      })),
      ...importedExercises.map(ex => ({
        ...ex,
        // Use consistent ID format for imported exercises - these IDs are used as database references
        id: ex.id || `imported-${ex.name.replace(/\s+/g, '-').toLowerCase()}`,
        primaryMuscles: Array.isArray(ex.primaryMuscles) 
          ? ex.primaryMuscles.map(normalizeMuscle)
          : [normalizeMuscle(String(ex.primaryMuscles))],
        secondaryMuscles: [],
        instructions: [ex.description || ''],
        defaultUnit: (ex.type === 'cardio' ? 'time' : 'kg') as Exercise['defaultUnit'],
        metrics: {
          trackWeight: ex.type !== 'cardio',
          trackReps: ex.type !== 'cardio',
          trackTime: ex.type === 'cardio',
          trackDistance: false,
          trackRPE: true,
        },
        customExercise: false
      }))
    ];

    // Custom exercises from Firestore have real document IDs that should be preserved
    setCombinedExercises([...normalizedExercises, ...customExercises]);
  }, [customExercises]);

  // Filter exercises based on search term and category
  const filteredExercises = combinedExercises.filter(exercise => {
    const primaryMuscles = exercise.primaryMuscles || [];
    const matchesSearch = searchTerm === '' || 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      primaryMuscles.some(m => 
        m.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (!selectedCategory) return matchesSearch;

    switch (selectedCategory) {
      case 'chest':
        return matchesSearch && primaryMuscles.includes('chest');
      case 'back':
        return matchesSearch && primaryMuscles.some(m => ['back', 'lats', 'traps'].includes(m));
      case 'legs':
        return matchesSearch && primaryMuscles.some(m => ['quadriceps', 'hip_flexors', 'hamstrings', 'calves', 'glutes'].includes(m));
      case 'shoulders':
        return matchesSearch && primaryMuscles.includes('shoulders');
      case 'arms':
        return matchesSearch && primaryMuscles.some(m => ['biceps', 'triceps', 'forearms'].includes(m));
      case 'core':
        return matchesSearch && primaryMuscles.includes('core');
      default:
        return matchesSearch;
    }
  });

  const handleExerciseToggle = (exercise: Exercise) => {
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(exercise.id)) {
      newSelected.delete(exercise.id);
    } else {
      newSelected.add(exercise.id);
    }
    setSelectedExercises(newSelected);
  };

  const handleAddSelected = () => {
    const exercisesToAdd = filteredExercises.filter(ex => selectedExercises.has(ex.id));
    const exercisesWithSets = exercisesToAdd.map(exercise => ({
      exercise,
      sets: [
        { reps: 5, weight: 0, difficulty: DifficultyCategory.NORMAL },
        { reps: 5, weight: 0, difficulty: DifficultyCategory.NORMAL },
        { reps: 5, weight: 0, difficulty: DifficultyCategory.NORMAL }
      ] as ExerciseSet[]
    }));
    
    onSelectExercises(exercisesWithSets);
    onClose();
  };

  return (
    <AppOverlay
      isOpen={true}
      onClose={onClose}
      className="z-[120] flex items-center justify-center p-4"
      ariaLabel="Exercise database"
    >
      <div className="bg-bg-secondary text-text-primary rounded-lg w-full max-w-4xl h-5/6 flex flex-col shadow-xl border border-border" onMouseDown={(event) => event.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text-primary">Exercise Database</h2>
            <button 
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary text-2xl"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-tertiary text-text-primary rounded-lg border border-border focus:border-accent-primary focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-accent-primary text-text-inverse'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-quaternary hover:text-text-primary'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center text-text-tertiary py-12">
              <div className="animate-spin w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full mx-auto mb-4"></div>
              Loading exercises...
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center text-text-tertiary py-12">
              <p className="text-lg mb-2">No exercises found</p>
              <p className="text-sm">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => handleExerciseToggle(exercise)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedExercises.has(exercise.id)
                      ? 'bg-accent-primary/20 border-accent-primary'
                      : 'bg-bg-tertiary border-border hover:border-border-hover'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-text-primary font-medium text-sm leading-tight">{exercise.name}</h3>
                    {selectedExercises.has(exercise.id) && (
                      <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                        <span className="text-text-inverse text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(exercise.primaryMuscles || []).slice(0, 2).map((muscle, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs bg-bg-quaternary text-text-secondary rounded">
                        {muscle}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-xs text-text-tertiary">
                    {exercise.type} • {exercise.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-text-tertiary text-sm">
              {selectedExercises.size} exercise{selectedExercises.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-quaternary"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSelected}
                disabled={selectedExercises.size === 0}
                className="px-6 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Selected ({selectedExercises.size})
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppOverlay>
  );
};

export default ExerciseDatabasePicker;
