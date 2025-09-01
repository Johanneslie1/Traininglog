import { useState } from 'react';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import CopyFromPreviousSessionDialog from './CopyFromPreviousSessionDialog';
import CategoryButton, { Category } from './CategoryButton';
import ProgramExercisePicker from '@/features/programs/ProgramExercisePicker';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import SportActivityPicker from '@/components/activities/SportActivityPicker';
import SpeedAgilityActivityPicker from '@/components/activities/SpeedAgilityActivityPicker';
import StretchingActivityPicker from '@/components/activities/StretchingActivityPicker';
import EnduranceActivityPicker from '@/components/activities/EnduranceActivityPicker';
import OtherActivityPicker from '@/components/activities/OtherActivityPicker';
import ResistanceTrainingPicker from '@/components/activities/ResistanceTrainingPicker';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { useEffect } from 'react';
import { searchExercises } from '@/services/exerciseDatabaseService';
import { CreateUniversalExerciseDialog } from '@/components/exercises/CreateUniversalExerciseDialog';
import { ActivityType } from '@/types/activityTypes';

type ExerciseData = Partial<Exercise & { sets?: ExerciseSet[] }>;

interface LogOptionsProps {
  onClose: () => void;
  onExerciseAdded?: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null; // Add editing exercise prop
}

type ViewState = 'main' | 'setEditor' | 'programPicker' | 'copyPrevious' | 'sport' | 'stretching' | 'endurance' | 'other' | 'speedAgility' | 'resistance' | 'universalSearch' | 'editExercise';

const helperCategories: Category[] = [
  { id: 'programs', name: 'Add from Program', icon: '📋', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-purple-600', textColor: 'text-white' },
  { id: 'copyPrevious', name: 'Copy from Previous', icon: '📝', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-white' },
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
  name: 'Speed, Agility & Plyometrics',
  description: 'Sprints, jumps, plyometrics, change of direction',
    icon: '⚡',
    bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-600',
    textColor: 'text-white',
  examples: 'Plyometrics, Ladder, Sprints, Jumps'
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
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [universalSearchQuery, setUniversalSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createDialogActivityType, setCreateDialogActivityType] = useState<ActivityType>(ActivityType.RESISTANCE);
  const user = useSelector((state: RootState) => state.auth.user);

  // If we're editing an exercise, go directly to edit view
  useEffect(() => {
    if (editingExercise) {
      setView('editExercise');
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
  if (view === 'universalSearch') {
    const searchResults = searchExercises(universalSearchQuery);
    
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-50">
        <header className="sticky top-0 flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setView('main')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-xl font-bold text-white">🔍 Universal Search</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto overscroll-contain pb-safe min-h-0">
          <div className="max-w-md mx-auto p-4 space-y-6">
            <section className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search all exercise databases..."
                  value={universalSearchQuery}
                  onChange={(e) => setUniversalSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </section>
            {universalSearchQuery && universalSearchQuery.length >= 2 && (
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-white/90">
                  Search Results ({searchResults.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.length > 0 ? (
                    searchResults.slice(0, 20).map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => {
                          setSelectedExercise(exercise);
                          setView('setEditor');
                        }}
                        className="w-full text-left p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#222] transition-colors border border-white/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{exercise.name}</h4>
                            <p className="text-gray-400 text-sm mt-1">
                              {exercise.activityType && `${exercise.activityType} • `}
                              {(exercise.primaryMuscles || []).join(', ') || 'No muscles specified'}
                            </p>
                            {exercise.description && (
                              <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                                {exercise.description}
                              </p>
                            )}
                          </div>
                          <div className="text-white/40">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : universalSearchQuery.length > 1 ? (
                    <div className="text-center py-8">
                      <p className="text-white/60">No exercises found for "{universalSearchQuery}"</p>
                      <p className="text-white/40 text-sm mt-2">Try a different search term or create a new exercise</p>
                      <button
                        onClick={() => {
                          setCreateDialogActivityType(ActivityType.RESISTANCE);
                          setShowCreateDialog(true);
                        }}
                        className="mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors mx-auto"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Create New Exercise
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/60">Type at least 2 characters to search</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Conditional rendering for different views
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

  if (view === 'resistance') {
    return (
      <ResistanceTrainingPicker
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

  if (view === 'stretching') {
    return (
      <StretchingActivityPicker
        onClose={onClose}
        onBack={() => setView('main')}
        onActivityLogged={() => { onExerciseAdded?.(); setView('main'); }}
        selectedDate={selectedDate}
        editingExercise={editingExercise}
      />
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

  if (view === 'setEditor' && selectedExercise) {
    return (
      <UniversalSetLogger
        exercise={selectedExercise}
        onCancel={() => {
          setSelectedExercise(null);
          setView('main');
        }}
        onSave={async (sets: ExerciseSet[]) => {
          try {
            console.log('💾 LogOptions: Starting to save exercise sets:', {
              exercise: selectedExercise,
              sets,
              user: user?.id,
              selectedDate
            });

            if (!user?.id) throw new Error('User not authenticated');

            const exerciseLogData = {
              exerciseName: selectedExercise.name,
              userId: user.id,
              sets: sets,
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
        initialSets={editingExercise?.sets}
        isEditing={!!editingExercise}
      />
    );
  }

  if (view === 'editExercise' && editingExercise) {
    // Convert UnifiedExerciseData to Exercise format for UniversalSetLogger
    const exerciseForLogger: Exercise = {
      id: editingExercise.id || `edit-${Date.now()}`,
      name: editingExercise.exerciseName,
      description: editingExercise.exerciseName,
      activityType: editingExercise.activityType,
      type: editingExercise.activityType === ActivityType.RESISTANCE ? 'strength' :
            editingExercise.activityType === ActivityType.ENDURANCE ? 'endurance' :
            editingExercise.activityType === ActivityType.STRETCHING ? 'flexibility' :
            editingExercise.activityType === ActivityType.SPORT ? 'teamSports' :
            editingExercise.activityType === ActivityType.SPEED_AGILITY ? 'speed_agility' : 'other',
      category: 'general',
      equipment: [],
      instructions: [],
      difficulty: 'intermediate',
      primaryMuscles: [],
      secondaryMuscles: [],
      targetAreas: [],
      metrics: {
        trackWeight: editingExercise.activityType === ActivityType.RESISTANCE,
        trackReps: true,
        trackTime: editingExercise.activityType !== ActivityType.RESISTANCE,
        trackDistance: editingExercise.activityType === ActivityType.ENDURANCE,
        trackRPE: true
      },
      defaultUnit: editingExercise.activityType === ActivityType.RESISTANCE ? 'kg' : 'time'
    };

    return (
      <UniversalSetLogger
        exercise={exerciseForLogger}
        onCancel={() => {
          setView('main');
        }}
        onSave={async (sets: ExerciseSet[]) => {
          try {
            console.log('💾 LogOptions: Updating exercise:', {
              exercise: editingExercise,
              sets,
              user: user?.id,
              selectedDate
            });

            if (!user?.id) throw new Error('User not authenticated');

            // Update the existing exercise with new sets
            const exerciseLogData = {
              exerciseName: editingExercise.exerciseName,
              userId: user.id,
              sets: sets,
              activityType: editingExercise.activityType
            };

            console.log('💾 LogOptions: Calling addExerciseLog with existing ID:', editingExercise.id);

            const docId = await addExerciseLog(
              exerciseLogData,
              editingExercise.timestamp || new Date(),
              editingExercise.id // Pass existing ID to update
            );

            console.log('✅ LogOptions: Exercise updated successfully with ID:', docId);

            onExerciseAdded?.();
            setView('main');
          } catch (error) {
            console.error('❌ LogOptions: Error updating exercise:', error);
            // Here you might want to show an error notification to the user
          }
        }}
        initialSets={editingExercise.sets}
        isEditing={true}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-50">
      {/* Header - Fixed at top */}
      <header className="sticky top-0 flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
        <h2 className="text-xl font-bold text-white">
          {editingExercise ? 'Edit Exercise' : 'Add Exercise'}
        </h2>
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
          {/* Universal Search Bar */}
          <section className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search all exercises..."
                className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onFocus={() => setView('universalSearch')}
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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

          {/* Create Custom Exercise Section */}
          <section className="space-y-3 md:space-y-4 border-t border-white/10 pt-4">
            <h3 className="text-lg font-semibold text-white/90">Create Custom Exercise</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {activityTypes.map(activityType => (
                <button
                  key={`create-${activityType.id}`}
                  onClick={() => {
                    let dialogActivityType = ActivityType.RESISTANCE;
                    switch (activityType.id) {
                      case 'resistance':
                        dialogActivityType = ActivityType.RESISTANCE;
                        break;
                      case 'sport':
                        dialogActivityType = ActivityType.SPORT;
                        break;
                      case 'stretching':
                        dialogActivityType = ActivityType.STRETCHING;
                        break;
                      case 'endurance':
                        dialogActivityType = ActivityType.ENDURANCE;
                        break;
                      case 'speedAgility':
                        dialogActivityType = ActivityType.SPEED_AGILITY;
                        break;
                      case 'other':
                        dialogActivityType = ActivityType.OTHER;
                        break;
                    }
                    setCreateDialogActivityType(dialogActivityType);
                    setShowCreateDialog(true);
                  }}
                  className="flex items-center p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left"
                >
                  <div className="text-lg mr-3">{activityType.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      Create {activityType.name}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      Custom exercise
                    </p>
                  </div>
                  <div className="text-white/40">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
      
      {/* Create Exercise Dialog */}
      {showCreateDialog && (
        <CreateUniversalExerciseDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={(_exerciseId) => {
            setShowCreateDialog(false);
            // Optionally handle the created exercise
          }}
          activityType={createDialogActivityType}
          searchQuery={universalSearchQuery}
        />
      )}
    </div>
  );
};

export default LogOptions;
