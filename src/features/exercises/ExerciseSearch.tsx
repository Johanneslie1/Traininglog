import React, { useState, useEffect } from 'react';
import { allExercises } from '@/data/exercises';
import { importedExercises } from '@/data/importedExercises';
import { Category } from './CategoryButton';
import { CreateUniversalExerciseDialog } from '@/components/exercises/CreateUniversalExerciseDialog';
import { Exercise, MuscleGroup } from '@/types/exercise';
import { ActivityType } from '@/types/activityTypes';
import { toast } from 'react-hot-toast';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { useAuth } from '@/hooks/useAuth';

interface ExerciseSearchProps {
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  category?: Category | null;
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

export const ExerciseSearch: React.FC<ExerciseSearchProps> = ({ 
  onClose, 
  onSelectExercise,
  category 
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [combinedExercises, setCombinedExercises] = useState<Exercise[]>([]);

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
        id: `default-${ex.name.replace(/\s+/g, '-').toLowerCase()}`,
        primaryMuscles: (ex.primaryMuscles || []).map(normalizeMuscle),
        secondaryMuscles: [],
        customExercise: false
      })),
      ...importedExercises.map(ex => ({
        ...ex,
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

    if (!category) return matchesSearch;

    switch (category.id) {
      case 'chest':
        return matchesSearch && primaryMuscles.includes('chest');
      case 'back':
        return matchesSearch && primaryMuscles.some(m => ['back', 'lats', 'traps'].includes(m));
      case 'legs':
        return matchesSearch && primaryMuscles.some(m => ['quadriceps', 'hamstrings', 'calves', 'glutes'].includes(m));
      case 'shoulders':
        return matchesSearch && primaryMuscles.includes('shoulders');
      case 'arms':
        return matchesSearch && primaryMuscles.some(m => ['biceps', 'triceps', 'forearms'].includes(m));
      case 'core':
        return matchesSearch && primaryMuscles.includes('core');
      case 'fullBody':
        return matchesSearch && (exercise.category === 'compound' || primaryMuscles.length > 2);
      case 'cardio':
        return matchesSearch && exercise.type === 'cardio';
      case 'stretching':
        return matchesSearch && exercise.type === 'flexibility';
      default:
        return matchesSearch;
    }
  });

  const handleCreateExercise = () => {
    setShowCreateDialog(true);
  };

  const handleExerciseCreated = async (exerciseId: string) => {
    setIsLoading(true);
    try {
      const exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
      if (exerciseDoc.exists()) {
        const data = exerciseDoc.data();
        const newExercise: Exercise = {
          ...data,
          id: exerciseId,
          primaryMuscles: data.primaryMuscles.map(normalizeMuscle),
          type: data.type as Exercise['type'],
          category: data.category as Exercise['category'],
          defaultUnit: data.defaultUnit as Exercise['defaultUnit']
        } as Exercise;
        
        setCustomExercises(prev => [...prev, newExercise]);
        onSelectExercise(newExercise);
        onClose();
      } else {
        toast.error('Could not find the created exercise');
      }
    } catch (error) {
      console.error('Error fetching created exercise:', error);
      toast.error('Failed to load the created exercise');
    } finally {
      setIsLoading(false);
      setShowCreateDialog(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary border-b border-border">
        <div className="flex items-center p-4">
          <button
            onClick={onClose}
            className="mr-4 p-2 rounded-full hover:bg-bg-tertiary transition-colors"
            aria-label="Close search"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="w-full bg-bg-secondary text-text-primary px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto pb-safe">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => onSelectExercise(exercise)}
                className="w-full text-left p-4 bg-bg-secondary rounded-xl hover:bg-bg-tertiary transition-colors"
              >
                <h3 className="text-text-primary font-medium">{exercise.name}</h3>
                <p className="text-text-tertiary text-sm mt-1">
                  {(exercise.primaryMuscles || []).join(', ') || 'No muscles specified'}
                </p>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 space-y-4">
              <div className="text-center py-12">
                <p className="text-text-secondary text-lg mb-2">No exercises found</p>
                <p className="text-text-tertiary">Can't find what you're looking for?</p>
              </div>
              <button
                onClick={handleCreateExercise}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-text-primary font-medium hover:bg-purple-700 transition-colors min-h-[44px]"
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
        <CreateUniversalExerciseDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleExerciseCreated}
          activityType={ActivityType.RESISTANCE}
          searchQuery={searchTerm}
        />
      )}
    </div>
  );
};

export default ExerciseSearch;
