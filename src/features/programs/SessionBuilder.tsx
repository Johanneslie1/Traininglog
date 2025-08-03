import React, { useState } from 'react';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { DifficultyCategory } from '@/types/difficulty';
import { ProgramSession, ProgramExercise } from '@/types/program';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import ExerciseHistoryPicker from './ExerciseHistoryPicker';
import ProgramExercisePicker from './ProgramExercisePicker';
import ExerciseDatabasePicker from './ExerciseDatabasePicker';
import ExerciseSearch from '@/features/exercises/ExerciseSearch';
import CategoryButton, { Category } from '@/features/exercises/CategoryButton';
import CopyFromPreviousSessionDialog from '@/features/exercises/CopyFromPreviousSessionDialog';
import { SetEditorDialog } from '@/components/SetEditorDialog';

interface SessionBuilderProps {
  onClose: () => void;
  onSave: (session: Omit<ProgramSession, 'userId'>) => void;
  initialSession?: Partial<ProgramSession>;
  sessionName?: string;
}

type ViewState = 'main' | 'exerciseSelection' | 'search' | 'setEditor' | 'programPicker' | 'copyPrevious' | 'history' | 'database';

// Exercise selection categories matching the logging dashboard
const helperCategories: Category[] = [
  { id: 'programs', name: 'Add from Program', icon: '📋', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-purple-600', textColor: 'text-white' },
  { id: 'copyPrevious', name: 'Copy from Previous', icon: '📝', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
  { id: 'history', name: 'From History', icon: '🕒', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-green-600', textColor: 'text-white' },
  { id: 'database', name: 'Exercise Database', icon: '🗄️', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-orange-600', textColor: 'text-white' },
];

const muscleGroups: Category[] = [
  { id: 'chest', name: 'Chest', icon: '💪', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-green-600', textColor: 'text-white' },
  { id: 'back', name: 'Back', icon: '🔙', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
  { id: 'legs', name: 'Legs', icon: '🦵', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-yellow-600', textColor: 'text-white' },
  { id: 'shoulders', name: 'Shoulders', icon: '🎯', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-cyan-600', textColor: 'text-white' },
  { id: 'arms', name: 'Arms', icon: '💪', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-red-600', textColor: 'text-white' },
  { id: 'core', name: 'Core', icon: '⭕', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-purple-600', textColor: 'text-white' },
  { id: 'fullBody', name: 'Full-Body', icon: '👤', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-orange-600', textColor: 'text-white' },
];

const trainingTypes: Category[] = [
  { id: 'cardio', name: 'Cardio', icon: '🏃', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-red-600', textColor: 'text-white' },
  { id: 'agility', name: 'Agility', icon: '⚡', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-yellow-600', textColor: 'text-white' },
  { id: 'speed', name: 'Speed', icon: '🏃‍♂️', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
  { id: 'stretching', name: 'Stretching', icon: '🧘‍♂️', bgColor: 'bg-[#2a2a2a]', iconBgColor: 'bg-green-600', textColor: 'text-white' },
];

const SessionBuilder: React.FC<SessionBuilderProps> = ({
  onClose,
  onSave,
  initialSession,
  sessionName = ''
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [view, setView] = useState<ViewState>('main');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  const [selectedExercises, setSelectedExercises] = useState<{ exercise: Exercise; sets: ExerciseSet[] }[]>(
    initialSession?.exercises?.map(ex => ({
      exercise: {
        id: ex.id,
        name: ex.name,
        type: 'strength' as const,
        category: 'compound' as const,
        primaryMuscles: [],
        secondaryMuscles: [],
        instructions: [],
        description: ex.notes || '',
        defaultUnit: 'kg' as const,
        metrics: { trackWeight: true, trackReps: true }
      },
      sets: ex.setsData || []
    })) || []
  );
  
  const [currentSessionName, setCurrentSessionName] = useState(initialSession?.name || sessionName);
  const [sessionNotes, setSessionNotes] = useState(initialSession?.notes || '');
  const [editingSet, setEditingSet] = useState<{ exerciseIndex: number; setIndex: number } | null>(null);
  const [tempSetData, setTempSetData] = useState<{ weight: string; reps: string }>({ weight: '', reps: '' });
  const [editingExerciseName, setEditingExerciseName] = useState<number | null>(null);
  const [tempExerciseName, setTempExerciseName] = useState('');

  // Exercise selection handlers
  const handleAddFromHistory = (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => {
    setSelectedExercises(prev => [...prev, ...exercises]);
    setView('main');
  };

  const handleAddFromPrograms = (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => {
    setSelectedExercises(prev => [...prev, ...exercises]);
    setView('main');
  };

  const handleAddFromDatabase = (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => {
    setSelectedExercises(prev => [...prev, ...exercises]);
    setView('main');
  };

  const handleCopiedExercises = (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => {
    setSelectedExercises(prev => [...prev, ...exercises]);
    setView('main');
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    // Map special categories to their respective views
    switch (category.id) {
      case 'programs':
        setView('programPicker');
        break;
      case 'copyPrevious':
        setView('copyPrevious');
        break;
      case 'history':
        setView('history');
        break;
      case 'database':
        setView('database');
        break;
      default:
        // For muscle groups and training types, go to search
        setView('search');
        break;
    }
  };

  const handleExerciseSelect = (exercise: any) => {
    // Convert the exercise template to a full Exercise
    setSelectedExercise({
      ...exercise,
      id: `temp-${exercise.name.toLowerCase().replace(/\s+/g, '-')}`,
      description: exercise.description || '',
      primaryMuscles: [],
      secondaryMuscles: [],
      instructions: [],
      metrics: {
        trackWeight: true,
        trackReps: true
      },
      defaultUnit: 'kg'
    });
    setView('setEditor');
  };

  const handleSaveNewExercise = async (set: ExerciseSet) => {
    if (!selectedExercise) return;

    const newExerciseWithSets = {
      exercise: selectedExercise,
      sets: [set]
    };

    setSelectedExercises(prev => [...prev, newExerciseWithSets]);
    setSelectedExercise(null);
    setView('main');
  };

  // Exercise management utilities
  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const result = Array.from(selectedExercises);
    if (direction === 'up' && index > 0) {
      [result[index - 1], result[index]] = [result[index], result[index - 1]];
    } else if (direction === 'down' && index < selectedExercises.length - 1) {
      [result[index], result[index + 1]] = [result[index + 1], result[index]];
    }
    setSelectedExercises(result);
  };

  const handleEditSet = (exerciseIndex: number, setIndex: number) => {
    const currentSet = selectedExercises[exerciseIndex].sets[setIndex];
    setTempSetData({
      weight: currentSet.weight?.toString() || '',
      reps: currentSet.reps?.toString() || ''
    });
    setEditingSet({ exerciseIndex, setIndex });
  };

  const handleSaveSetEdit = () => {
    if (editingSet) {
      const { exerciseIndex, setIndex } = editingSet;
      setSelectedExercises(prev => {
        const newExercises = [...prev];
        newExercises[exerciseIndex] = {
          ...newExercises[exerciseIndex],
          sets: newExercises[exerciseIndex].sets.map((set, idx) =>
            idx === setIndex
              ? {
                  ...set,
                  weight: parseFloat(tempSetData.weight) || 0,
                  reps: parseInt(tempSetData.reps) || 0
                }
              : set
          )
        };
        return newExercises;
      });
      setEditingSet(null);
      setTempSetData({ weight: '', reps: '' });
    }
  };

  const handleCancelSetEdit = () => {
    setEditingSet(null);
    setTempSetData({ weight: '', reps: '' });
  };

  const handleAddSet = (exerciseIndex: number) => {
    setSelectedExercises(prev => {
      const newExercises = [...prev];
      const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
      newExercises[exerciseIndex] = {
        ...newExercises[exerciseIndex],
        sets: [
          ...newExercises[exerciseIndex].sets,
          {
            reps: lastSet?.reps || 8,
            weight: lastSet?.weight || 0,
            difficulty: DifficultyCategory.NORMAL
          }
        ]
      };
      return newExercises;
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setSelectedExercises(prev => {
      const newExercises = [...prev];
      if (newExercises[exerciseIndex].sets.length > 1) {
        newExercises[exerciseIndex] = {
          ...newExercises[exerciseIndex],
          sets: newExercises[exerciseIndex].sets.filter((_, idx) => idx !== setIndex)
        };
      }
      return newExercises;
    });
  };

  const handleEditExerciseName = (exerciseIndex: number) => {
    setTempExerciseName(selectedExercises[exerciseIndex].exercise.name);
    setEditingExerciseName(exerciseIndex);
  };

  const handleSaveExerciseName = () => {
    if (!tempExerciseName.trim()) {
      alert('Exercise name cannot be empty');
      return;
    }
    
    if (editingExerciseName !== null) {
      setSelectedExercises(prev => {
        const newExercises = [...prev];
        newExercises[editingExerciseName] = {
          ...newExercises[editingExerciseName],
          exercise: {
            ...newExercises[editingExerciseName].exercise,
            name: tempExerciseName.trim()
          }
        };
        return newExercises;
      });
      setEditingExerciseName(null);
      setTempExerciseName('');
    }
  };

  const handleCancelExerciseNameEdit = () => {
    setEditingExerciseName(null);
    setTempExerciseName('');
  };

  const handleDuplicateExercise = (exerciseIndex: number) => {
    const exerciseToDuplicate = selectedExercises[exerciseIndex];
    const duplicatedExercise = {
      ...exerciseToDuplicate,
      exercise: {
        ...exerciseToDuplicate.exercise,
        id: `${exerciseToDuplicate.exercise.id}-duplicate-${Date.now()}`,
        name: `${exerciseToDuplicate.exercise.name} (Copy)`
      }
    };
    
    setSelectedExercises(prev => [
      ...prev.slice(0, exerciseIndex + 1),
      duplicatedExercise,
      ...prev.slice(exerciseIndex + 1)
    ]);
  };

  const handleSaveSession = () => {
    if (!currentSessionName.trim()) {
      alert('Please enter a session name');
      return;
    }

    if (selectedExercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    // Validate that all exercises have names
    const exercisesWithoutNames = selectedExercises.filter(item => !item.exercise.name?.trim());
    if (exercisesWithoutNames.length > 0) {
      alert(`Please ensure all exercises have names. Found ${exercisesWithoutNames.length} exercise(s) without names.`);
      return;
    }

    // Convert exercises to ProgramExercise format
    const exercises: ProgramExercise[] = selectedExercises.map((item, index) => ({
      id: `${item.exercise.id}-${index}`,
      name: item.exercise.name,
      order: index,
      sets: item.sets.length,
      reps: item.sets.reduce((total, set) => total + (set.reps || 0), 0),
      setsData: item.sets,
      notes: item.exercise.description || ''
    }));

    const session: Omit<ProgramSession, 'userId'> = {
      id: initialSession?.id || '',
      name: currentSessionName.trim(),
      exercises,
      notes: sessionNotes.trim()
    };

    onSave(session);
  };

  // Conditional rendering for different views
  if (view === 'programPicker') {
    return (
      <ProgramExercisePicker
        onClose={() => setView('main')}
        onSelectExercises={handleAddFromPrograms}
      />
    );
  }

  if (view === 'copyPrevious') {
    return (
      <CopyFromPreviousSessionDialog
        isOpen={true}
        onClose={() => setView('main')}
        onExercisesSelected={(exercises) => {
          const convertedExercises = exercises.map(ex => ({
            exercise: {
              id: ex.id || `temp-${ex.exerciseName?.toLowerCase().replace(/\s+/g, '-')}`,
              name: ex.exerciseName || '',
              type: 'strength' as const,
              category: 'compound' as const,
              primaryMuscles: [],
              secondaryMuscles: [],
              instructions: [],
              description: '',
              defaultUnit: 'kg' as const,
              metrics: { trackWeight: true, trackReps: true }
            },
            sets: ex.sets || []
          }));
          handleCopiedExercises(convertedExercises);
        }}
        currentDate={new Date()}
        userId={user?.id || ''}
      />
    );
  }

  if (view === 'history') {
    return (
      <ExerciseHistoryPicker
        onClose={() => setView('main')}
        onSelectExercises={handleAddFromHistory}
      />
    );
  }

  if (view === 'database') {
    return (
      <ExerciseDatabasePicker
        onClose={() => setView('main')}
        onSelectExercises={handleAddFromDatabase}
      />
    );
  }

  if (view === 'search') {
    return (
      <ExerciseSearch
        onClose={() => setView('main')}
        category={selectedCategory}
        onSelectExercise={handleExerciseSelect}
      />
    );
  }

  if (view === 'setEditor' && selectedExercise) {
    return (
      <SetEditorDialog
        onClose={() => {
          setSelectedExercise(null);
          setView('main');
        }}
        onSave={handleSaveNewExercise}
        exerciseName={selectedExercise.name}
        setNumber={1}
        totalSets={1}
      />
    );
  }

  if (view === 'exerciseSelection') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-50">
        {/* Header - Fixed at top */}
        <header className="sticky top-0 flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Add Exercises</h2>
          <button 
            onClick={() => setView('main')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-safe min-h-0">
          <div className="max-w-md mx-auto p-4 space-y-6 md:space-y-8">
            {/* Quick Add Section */}
            <section className="space-y-3 md:space-y-4">
              <h3 className="text-lg font-semibold text-white/90">Quick Add</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {helperCategories.map(category => (
                  <CategoryButton
                    key={category.id}
                    category={category}
                    onClick={() => handleCategorySelect(category)}
                  />
                ))}
              </div>
            </section>

            {/* Muscle Groups Section */}
            <section className="space-y-3 md:space-y-4">
              <h3 className="text-lg font-semibold text-white/90">Muscle Groups</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
                {muscleGroups.map(category => (
                  <CategoryButton
                    key={category.id}
                    category={category}
                    onClick={() => handleCategorySelect(category)}
                  />
                ))}
              </div>
            </section>

            {/* Training Types Section */}
            <section className="space-y-3 md:space-y-4">
              <h3 className="text-lg font-semibold text-white/90">Training Types</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
                {trainingTypes.map(category => (
                  <CategoryButton
                    key={category.id}
                    category={category}
                    onClick={() => handleCategorySelect(category)}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  // Main session builder view
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-black/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-medium">Session Builder</h1>
        </div>
        
        <button
          onClick={handleSaveSession}
          className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-colors font-medium"
        >
          Save Session
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        {/* Session Details */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Name
            </label>
            <input
              type="text"
              value={currentSessionName}
              onChange={(e) => setCurrentSessionName(e.target.value)}
              placeholder="Enter session name"
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Notes (Optional)
            </label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Add notes about this session"
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#8B5CF6] resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Exercises Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Exercises ({selectedExercises.length})</h2>
            <button
              onClick={() => setView('exerciseSelection')}
              className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors border border-white/10"
            >
              Add Exercise
            </button>
          </div>

          {selectedExercises.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-lg mb-2">No exercises added yet</p>
              <p className="text-sm mb-4">Add exercises from your history, programs, or the database</p>
              <button
                onClick={() => setView('exerciseSelection')}
                className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-colors"
              >
                Add First Exercise
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedExercises.map((item, exerciseIndex) => (
                <div key={`${item.exercise.id}-${exerciseIndex}`} className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
                  {/* Exercise Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      {editingExerciseName === exerciseIndex ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempExerciseName}
                            onChange={(e) => setTempExerciseName(e.target.value)}
                            className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-white/10 rounded text-white text-lg font-medium focus:outline-none focus:border-[#8B5CF6]"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveExerciseName}
                            className="p-1 hover:bg-white/10 rounded text-green-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelExerciseNameEdit}
                            className="p-1 hover:bg-white/10 rounded text-red-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditExerciseName(exerciseIndex)}
                          className="text-left hover:bg-white/5 rounded p-1 -m-1 transition-colors"
                        >
                          <h3 className="text-lg font-medium text-white">{item.exercise.name}</h3>
                        </button>
                      )}
                    </div>
                    
                    {/* Exercise Controls */}
                    <div className="flex items-center gap-1">
                      {/* Move Up */}
                      {exerciseIndex > 0 && (
                        <button
                          onClick={() => moveExercise(exerciseIndex, 'up')}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      )}
                      
                      {/* Move Down */}
                      {exerciseIndex < selectedExercises.length - 1 && (
                        <button
                          onClick={() => moveExercise(exerciseIndex, 'down')}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                      
                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicateExercise(exerciseIndex)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Duplicate exercise"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      
                      {/* Delete */}
                      <button
                        onClick={() => handleRemoveExercise(exerciseIndex)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                        title="Remove exercise"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Sets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">Sets ({item.sets.length})</span>
                      <button
                        onClick={() => handleAddSet(exerciseIndex)}
                        className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors text-sm border border-white/10"
                      >
                        Add Set
                      </button>
                    </div>
                    
                    {item.sets.map((set, setIndex) => (
                      <div key={`${item.exercise.id}-set-${setIndex}`} className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
                        <span className="text-sm text-gray-400 w-8">#{setIndex + 1}</span>
                        
                        {editingSet?.exerciseIndex === exerciseIndex && editingSet?.setIndex === setIndex ? (
                          <>
                            <input
                              type="number"
                              value={tempSetData.weight}
                              onChange={(e) => setTempSetData(prev => ({ ...prev, weight: e.target.value }))}
                              placeholder="Weight"
                              className="flex-1 px-2 py-1 bg-[#1a1a1a] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[#8B5CF6]"
                            />
                            <span className="text-gray-400 text-sm">kg</span>
                            <span className="text-gray-400">×</span>
                            <input
                              type="number"
                              value={tempSetData.reps}
                              onChange={(e) => setTempSetData(prev => ({ ...prev, reps: e.target.value }))}
                              placeholder="Reps"
                              className="flex-1 px-2 py-1 bg-[#1a1a1a] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[#8B5CF6]"
                            />
                            <button
                              onClick={handleSaveSetEdit}
                              className="p-1 hover:bg-white/10 rounded text-green-400"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelSetEdit}
                              className="p-1 hover:bg-white/10 rounded text-red-400"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditSet(exerciseIndex, setIndex)}
                              className="flex-1 text-left hover:bg-white/5 rounded p-1 -m-1 transition-colors"
                            >
                              <span className="text-white font-medium">{set.weight || 0} kg</span>
                              <span className="text-gray-400 mx-2">×</span>
                              <span className="text-white font-medium">{set.reps || 0} reps</span>
                            </button>
                            {item.sets.length > 1 && (
                              <button
                                onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                                className="p-1 hover:bg-white/10 rounded text-red-400"
                                title="Remove set"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SessionBuilder;
