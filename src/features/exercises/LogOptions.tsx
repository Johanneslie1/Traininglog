import { useState } from 'react';
import ExerciseSearch from './ExerciseSearch';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import CopyFromPreviousSessionDialog from './CopyFromPreviousSessionDialog';
import CategoryButton, { Category } from './CategoryButton';
import ProgramExercisePicker from '@/features/programs/ProgramExercisePicker';
import { SetEditorDialog } from '@/components/SetEditorDialog';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import SportActivityPicker from '@/components/activities/SportActivityPicker';
import SpeedAgilityActivityPicker from '@/components/activities/SpeedAgilityActivityPicker';
// import StretchingActivityPicker from '@/components/activities/StretchingActivityPicker';
import EnduranceActivityPicker from '@/components/activities/EnduranceActivityPicker';
import OtherActivityPicker from '@/components/activities/OtherActivityPicker';
import { ExerciseHistoryPicker } from '@/features/programs/ExerciseHistoryPicker';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { useEffect } from 'react';

type ExerciseData = Partial<Exercise & { sets?: ExerciseSet[] }>;

interface LogOptionsProps {
  onClose: () => void;
  onExerciseAdded?: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null; // Add editing exercise prop
}

type ViewState = 'main' | 'search' | 'calendar' | 'setEditor' | 'programPicker' | 'copyPrevious' | 'sport' | 'stretching' | 'endurance' | 'other' | 'speedAgility' | 'resistance' | 'recentExercises';

const helperCategories: Category[] = [
  { id: 'programs', name: 'Add from Program', icon: '📋', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-purple-600', textColor: 'text-white' },
  { id: 'copyPrevious', name: 'Copy from Previous', icon: '📝', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
];

const muscleGroups: Category[] = [
  { id: 'chest', name: 'Chest', icon: '💪', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-green-600', textColor: 'text-white' },
  { id: 'back', name: 'Back', icon: '🔙', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
  { id: 'legs', name: 'Legs', icon: '🦵', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-yellow-600', textColor: 'text-white' },
  { id: 'shoulders', name: 'Shoulders', icon: '🎯', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-cyan-600', textColor: 'text-white' },
  { id: 'arms', name: 'Arms', icon: '💪', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-red-600', textColor: 'text-white' },
  { id: 'core', name: 'Core', icon: '⭕', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-primary-600', textColor: 'text-white' },
  { id: 'fullBody', name: 'Full-Body', icon: '👤', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-orange-600', textColor: 'text-white' },
];

// Activity types for the main selection
const activityTypes = [
  {
    id: 'resistance',
    name: 'Resistance Training',
    description: 'Weight lifting, strength training',
    icon: '🏋️‍♂️',
    bgColor: 'bg-gradient-to-r from-blue-500 to-blue-700',
    textColor: 'text-white',
    examples: 'Squats, Deadlifts, Bench Press'
  },
  {
    id: 'sport',
    name: 'Sports',
    description: 'Team sports, individual competitions',
    icon: '⚽',
    bgColor: 'bg-gradient-to-r from-green-500 to-green-700',
    textColor: 'text-white',
    examples: 'Football, Basketball, Tennis'
  },
  {
    id: 'stretching',
    name: 'Stretching & Flexibility',
    description: 'Static stretches, yoga, mobility',
    icon: '🧘‍♀️',
    bgColor: 'bg-gradient-to-r from-purple-500 to-purple-700',
    textColor: 'text-white',
    examples: 'Yoga, Static Stretches, PNF'
  },
  {
    id: 'endurance',
    name: 'Endurance Training',
    description: 'Cardio, running, cycling',
    icon: '🏃‍♂️',
    bgColor: 'bg-gradient-to-r from-red-500 to-red-700',
    textColor: 'text-white',
    examples: 'Running, Cycling, Swimming'
  },
  {
    id: 'speedAgility',
    name: 'Speed & Agility',
    description: 'Sprints, plyometrics, change of direction',
    icon: '⚡',
    bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-600',
    textColor: 'text-white',
    examples: 'Plyometrics, Ladder, Sprints'
  },
  {
    id: 'other',
    name: 'Other Activities',
    description: 'Custom activities and tracking',
    icon: '🎯',
    bgColor: 'bg-gradient-to-r from-gray-500 to-gray-700',
    textColor: 'text-white',
    examples: 'Meditation, Therapy, Custom'
  }
];

export const LogOptions = ({ onClose, onExerciseAdded, selectedDate, editingExercise }: LogOptionsProps): JSX.Element => {
  const [view, setView] = useState<ViewState>('main');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  // If we're editing an exercise, determine which view to show based on activity type
  useEffect(() => {
    if (editingExercise) {
      switch (editingExercise.activityType) {
        case 'sport':
          setView('sport');
          break;
        case 'stretching':
          setView('stretching');
          break;
        case 'endurance':
          setView('endurance');
          break;
        case 'other':
          setView('other');
          break;
        case 'speedAgility':
          setView('speedAgility');
          break;
        default:
          setView('main');
      }
    }
  }, [editingExercise]);

  const handleProgramSelected = async (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => {
    if (!user?.id) return;

    try {
      for (const { exercise, sets } of exercises) {
        await addExerciseLog(
          {
            exerciseName: exercise.name,
            userId: user.id,
            sets: sets,
          },
          selectedDate || new Date()
        );
      }

      setView('main');
      onExerciseAdded?.();
    } catch (error) {
      console.error('Error saving program exercises:', error);
      // Here you might want to show an error notification to the user
    }
  };

  const handleCopiedExercises = async (exercises: ExerciseData[]) => {
    if (!user?.id) return;

    try {
      for (const exercise of exercises) {
        if (!exercise.name) continue;

        await addExerciseLog(
          {
            exerciseName: exercise.name,
            userId: user.id,
            sets: exercise.sets || [],
          },
          selectedDate || new Date()
        );
      }

      setView('main');
      onExerciseAdded?.();
    } catch (error) {
      console.error('Error saving copied exercises:', error);
      // Here you might want to show an error notification to the user
    }
  };

  // Conditional rendering for different views
  if (view === 'recentExercises') {
    return (
      <ExerciseHistoryPicker
        onClose={() => setView('resistance')}
        onSelectExercises={handleProgramSelected}
      />
    );
  }

  if (view === 'sport') {
    return (
      <SportActivityPicker
        onClose={onClose}
        onBack={() => setView('main')}
        onActivityLogged={() => {
          onExerciseAdded?.();
          setView('main');
        }}
        selectedDate={selectedDate}
        editingExercise={editingExercise} // Pass editing exercise
      />
    );
  }

  if (view === 'stretching') {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1a1a1a] rounded-xl p-6">
          <div className="text-white text-center">
            <h3 className="text-xl font-bold mb-2">Stretching & Flexibility</h3>
            <p className="text-gray-400 mb-4">Coming soon! Use the new JSON database for stretching exercises.</p>
            <button 
              onClick={() => setView('main')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'endurance') {
    return (
      <EnduranceActivityPicker
        onClose={onClose}
        onBack={() => setView('main')}
        onActivityLogged={() => {
          onExerciseAdded?.();
          setView('main');
        }}
        selectedDate={selectedDate}
        editingExercise={editingExercise} // Pass editing exercise
      />
    );
  }

  if (view === 'other') {
    return (
      <OtherActivityPicker
        onClose={onClose}
        onBack={() => setView('main')}
        onActivityLogged={() => {
          onExerciseAdded?.();
          setView('main');
        }}
        selectedDate={selectedDate}
      />
    );
  }

  if (view === 'speedAgility') {
    return (
      <SpeedAgilityActivityPicker
        onClose={onClose}
        onBack={() => setView('main')}
        onActivityLogged={() => {
          onExerciseAdded?.();
          setView('main');
        }}
        selectedDate={selectedDate}
        editingExercise={editingExercise}
      />
    );
  }

  if (view === 'programPicker') {
    return (
      <ProgramExercisePicker
        onClose={() => setView('main')}
        onSelectExercises={handleProgramSelected}
      />
    );
  }

  if (view === 'copyPrevious') {
    return (
      <CopyFromPreviousSessionDialog
        isOpen={true}
        onClose={() => setView('main')}
        onExercisesSelected={handleCopiedExercises}
        currentDate={selectedDate || new Date()}
        userId={user?.id || ''}
      />
    );
  }

  if (view === 'search') {
    return (
      <ExerciseSearch
        onClose={() => setView('resistance')}
        category={selectedCategory}
        onSelectExercise={(exercise) => {
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
        }}
      />
    );
  }

  // Resistance Training View - Shows search, categories, and recent exercises
  if (view === 'resistance') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-50">
        {/* Header */}
        <header className="sticky top-0 flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setView('main')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-white">🏋️‍♂️ Resistance Training</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-safe min-h-0">
          <div className="max-w-md mx-auto p-4 space-y-6 md:space-y-8">
            {/* Search Box */}
            <section className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search exercises..."
                  className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onFocus={() => {
                    setSelectedCategory(null);
                    setView('search');
                  }}
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </section>

            {/* Quick Options */}
            <section className="space-y-3 md:space-y-4">
              <h3 className="text-lg font-semibold text-white/90">Quick Options</h3>
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                <CategoryButton
                  category={{ id: 'recent', name: 'Recent Exercises', icon: '🕒', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-white' }}
                  onClick={() => setView('recentExercises')}
                />
              </div>
            </section>

            {/* Muscle Groups */}
            <section className="space-y-3 md:space-y-4">
              <h3 className="text-lg font-semibold text-white/90">Muscle Groups</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
                {muscleGroups.map(category => (
                  <CategoryButton
                    key={category.id}
                    category={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setView('search');
                    }}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'setEditor' && selectedExercise) {
    return (
      <SetEditorDialog
        onClose={() => {
          setSelectedExercise(null);
          setView('main');
        }}
        onSave={async (set) => {
          try {
            console.log('💾 LogOptions: Starting to save exercise set:', {
              exercise: selectedExercise,
              set,
              user: user?.id,
              selectedDate
            });

            if (!user?.id) throw new Error('User not authenticated');

            const exerciseLogData = {
              exerciseName: selectedExercise.name,
              userId: user.id,
              sets: [set],
            };

            console.log('💾 LogOptions: Calling addExerciseLog with:', exerciseLogData);

            const docId = await addExerciseLog(
              exerciseLogData,
              selectedDate || new Date()
            );

            console.log('✅ LogOptions: Exercise saved successfully with ID:', docId);

            onExerciseAdded?.();
            setSelectedExercise(null);
            setView('main');
          } catch (error) {
            console.error('❌ LogOptions: Error saving exercise:', error);
            // Here you might want to show an error notification to the user
          }
        }}
        exerciseName={selectedExercise.name}
        setNumber={1}
        totalSets={1}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-50">
      {/* Header - Fixed at top */}
      <header className="sticky top-0 flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
        <h2 className="text-xl font-bold text-white">Add Exercise</h2>
        <button 
          onClick={onClose}
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
          {/* Activity Types Section */}
          <section className="space-y-3 md:space-y-4">
            <h3 className="text-lg font-semibold text-white/90">Choose Activity Type</h3>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {activityTypes.map(activityType => (
                <div
                  key={activityType.id}
                  onClick={() => {
                    if (activityType.id === 'resistance') {
                      // For resistance training, show the resistance training menu
                      setView('resistance');
                    } else if (activityType.id === 'sport') {
                      setView('sport');
                    } else if (activityType.id === 'stretching') {
                      setView('stretching');
                    } else if (activityType.id === 'endurance') {
                      setView('endurance');
                    } else if (activityType.id === 'other') {
                      setView('other');
                    } else if (activityType.id === 'speedAgility') {
                      setView('speedAgility');
                    }
                  }}
                  className={`
                    ${activityType.bgColor}
                    rounded-xl p-4 cursor-pointer
                    transition-all duration-200 ease-in-out
                    hover:scale-105 hover:shadow-lg
                    active:scale-95
                    border border-white/10
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{activityType.icon}</div>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-lg ${activityType.textColor}`}>
                        {activityType.name}
                      </h4>
                      <p className={`text-sm opacity-90 ${activityType.textColor}`}>
                        {activityType.description}
                      </p>
                      <p className={`text-xs opacity-75 mt-1 ${activityType.textColor}`}>
                        {activityType.examples}
                      </p>
                    </div>
                    <div className="text-white/60">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Add Section */}
          <section className="space-y-3 md:space-y-4">
            <h3 className="text-lg font-semibold text-white/90">Quick Add</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {helperCategories.map(category => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  onClick={() => {
                    if (category.id === 'programs') {
                      setView('programPicker');
                    } else if (category.id === 'copyPrevious') {
                      setView('copyPrevious');
                    }
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LogOptions;
