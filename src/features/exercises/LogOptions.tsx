import { useState } from 'react'
import toast from 'react-hot-toast';
import { TrainingTypeSelector } from '@/components/TrainingTypeSelector';
import { TrainingType } from '@/types/exercise';
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
import { CreateUniversalExerciseDialog } from '@/components/exercises/CreateUniversalExerciseDialog';
import { ActivityType } from '@/types/activityTypes';
import { ExerciseData } from '@/services/exerciseDataService';
import { auth } from '@/services/firebase/config';
import { saveExerciseLog } from '@/utils/localStorageUtils';
import { generateExercisePrescriptionAssistant } from '@/services/exercisePrescriptionAssistantService';
import { ExercisePrescriptionAssistantData } from '@/types/exercise';

interface LogOptionsProps {
  onClose: () => void;
  onExerciseAdded?: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null; // Add editing exercise prop
  initialWarmupMode?: boolean;
}

type ViewState = 'main' | 'setEditor' | 'programPicker' | 'copyPrevious' | 'sport' | 'stretching' | 'endurance' | 'other' | 'speedAgility' | 'resistance' | 'editExercise' | 'selectType';

const helperCategories: Category[] = [
  { id: 'programs', name: 'Add from Program', icon: '📋', bgColor: 'bg-bg-tertiary', iconBgColor: 'bg-purple-600', textColor: 'text-text-primary' },
  { id: 'copyPrevious', name: 'Copy from Previous', icon: '📝', bgColor: 'bg-bg-tertiary', iconBgColor: 'bg-blue-600', textColor: 'text-text-primary' },
];

// Activity types for the main selection
const activityTypes = [
  {
    id: 'resistance',
    name: 'Resistance Training',
    description: 'Weight lifting, strength training',
    icon: '🏋️‍♂️',
    bgColor: 'bg-blue-600 dark:bg-blue-600',
    textColor: 'text-white',
    examples: 'Squats, Deadlifts, Bench Press'
  },
  {
    id: 'sport',
    name: 'Sports',
    description: 'Team sports, individual competitions',
    icon: '⚽',
    bgColor: 'bg-green-600 dark:bg-green-600',
    textColor: 'text-white',
    examples: 'Football, Basketball, Tennis'
  },
  {
    id: 'stretching',
    name: 'Stretching & Flexibility',
    description: 'Static stretches, yoga, mobility',
    icon: '🧘‍♀️',
    bgColor: 'bg-purple-600 dark:bg-purple-600',
    textColor: 'text-white',
    examples: 'Yoga, Static Stretches, PNF'
  },
  {
    id: 'endurance',
    name: 'Endurance Training',
    description: 'Cardio, running, cycling',
    icon: '🏃‍♂️',
    bgColor: 'bg-red-600 dark:bg-red-600',
    textColor: 'text-white',
    examples: 'Running, Cycling, Swimming'
  },
  {
    id: 'speedAgility',
  name: 'Speed, Agility & Plyometrics',
  description: 'Sprints, jumps, plyometrics, change of direction',
    icon: '⚡',
    bgColor: 'bg-amber-600 dark:bg-amber-600',
    textColor: 'text-white',
  examples: 'Plyometrics, Ladder, Sprints, Jumps'
  },
  {
    id: 'other',
    name: 'Other Activities',
    description: 'Custom activities and tracking',
    icon: '🎯',
    bgColor: 'bg-gray-600 dark:bg-gray-600',
    textColor: 'text-white',
    examples: 'Meditation, Therapy, Custom'
  }
];

export const LogOptions = ({ onClose, onExerciseAdded, selectedDate, editingExercise, initialWarmupMode = false }: LogOptionsProps): JSX.Element => {
  const [view, setView] = useState<ViewState>('main');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isWarmupMode, setIsWarmupMode] = useState(false);
  
  const user = useSelector((state: RootState) => state.auth.user);

  // If we're editing an exercise, go directly to edit view
  useEffect(() => {
    if (editingExercise) {
      setView('editExercise');
      setIsWarmupMode(Boolean(editingExercise.isWarmup));
      return;
    }

    setIsWarmupMode(initialWarmupMode);
  }, [editingExercise, initialWarmupMode]);

  const handleTrainingTypeSelected = (type: TrainingType) => {
    switch(type) {
      case TrainingType.STRENGTH:
        setView('resistance');
        break;
      case TrainingType.ENDURANCE:
        setView('endurance');
        break;
      case TrainingType.FLEXIBILITY:
        setView('stretching');
        break;
      case TrainingType.SPEED_AGILITY:
        setView('speedAgility');
        break;
      case TrainingType.TEAM_SPORTS:
        setView('sport');
        break;
      case TrainingType.OTHER:
        setView('other');
        break;
      default:
        setView('main');
    }
  };
  const handleProgramSelected = async (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => {
    const userId = user?.id || auth.currentUser?.uid;

    if (!userId) {
      toast.error('You need to be logged in to add exercises');
      return;
    }

    if (exercises.length === 0) {
      toast('No exercises selected', { icon: 'ℹ️' });
      return;
    }

    try {
      // Check if any exercises have pre-filled sets (from prescriptions)
      const hasPrefilledSets = exercises.some(ex => ex.sets && ex.sets.length > 0);
      let savedCount = 0;
      
      for (const { exercise } of exercises) {
        const sets: ExerciseSet[] = [];
        const prescriptionAssistant = await generateExercisePrescriptionAssistant({
          exercise: {
            id: exercise.id,
            name: exercise.name,
            activityType: exercise.activityType,
            prescription: exercise.prescription
          },
          userId,
          sessionContext: {
            date: (selectedDate || new Date()).toISOString().slice(0, 10),
            warmupDone: true
          }
        });

        const createdId = await addExerciseLog(
          {
            exerciseName: exercise.name,
            userId,
            sets: sets,
            activityType: exercise.activityType,
            isWarmup: isWarmupMode || Boolean((exercise as any).isWarmup),
            prescription: exercise.prescription,
            instructionMode: exercise.instructionMode,
            instructions: typeof exercise.instructions === 'string'
              ? exercise.instructions
              : Array.isArray(exercise.instructions)
                ? exercise.instructions[0]
                : undefined,
            prescriptionAssistant,
          },
          selectedDate || new Date()
        );

        saveExerciseLog({
          id: createdId,
          exerciseName: exercise.name,
          userId,
          sets,
          timestamp: selectedDate || new Date(),
          activityType: exercise.activityType,
          isWarmup: isWarmupMode || Boolean((exercise as any).isWarmup),
          prescription: exercise.prescription,
          instructionMode: exercise.instructionMode,
          instructions: typeof exercise.instructions === 'string'
            ? exercise.instructions
            : Array.isArray(exercise.instructions)
              ? exercise.instructions[0]
              : undefined,
          prescriptionAssistant
        });

        savedCount += 1;
      }

      onExerciseAdded?.();
      onClose();
      
      // Show appropriate toast message
      if (hasPrefilledSets) {
        toast.success(`Added ${savedCount} exercise${savedCount !== 1 ? 's' : ''} with program values`);
      } else {
        toast.success(`Added ${savedCount} exercise${savedCount !== 1 ? 's' : ''} from program`);
      }
    } catch (error) {
      console.error('Error saving program exercises:', error);
      toast.error('Failed to add exercises. Please try again.');
    }
  };

  const handleCopiedExercises = async (exercises: ExerciseData[]) => {
    if (!user?.id) return;

    try {
      console.log('🔄 Processing copied exercises:', exercises.length, exercises);
      
      for (const exercise of exercises) {
        if (!exercise.exerciseName) {
          console.warn('⚠️ Skipping exercise without name:', exercise);
          continue;
        }

        const exerciseLogData = {
          exerciseName: exercise.exerciseName,
          userId: user.id,
          sets: exercise.sets || [],
          ...(exercise.activityType && { activityType: exercise.activityType }),
          isWarmup: isWarmupMode || Boolean((exercise as any).isWarmup)
        };

        console.log('💾 Saving copied exercise:', exerciseLogData);
        await addExerciseLog(
          exerciseLogData,
          selectedDate || new Date()
        );
      }

      setView('main');
      onExerciseAdded?.();
      console.log('✅ Successfully saved all copied exercises');
    } catch (error) {
      console.error('❌ Error saving copied exercises:', error);
      // Here you might want to show an error notification to the user
    }
  };

  // Conditional rendering for different views

  // Handle selectType view
  if (view === 'selectType') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">Select Training Type</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TrainingTypeSelector onSelect={handleTrainingTypeSelected} />
        </div>
      </div>
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
        isWarmupMode={isWarmupMode}
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
        isWarmupMode={isWarmupMode}
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
        isWarmupMode={isWarmupMode}
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
        isWarmupMode={isWarmupMode}
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
        isWarmupMode={isWarmupMode}
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
        isWarmupMode={isWarmupMode}
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
        onSave={async (sets: ExerciseSet[], metadata?: { prescriptionAssistant?: ExercisePrescriptionAssistantData }) => {
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
              activityType: selectedExercise.activityType,
              isWarmup: isWarmupMode,
              prescription: selectedExercise.prescription,
              instructionMode: selectedExercise.instructionMode,
              instructions: typeof selectedExercise.instructions === 'string'
                ? selectedExercise.instructions
                : Array.isArray(selectedExercise.instructions)
                  ? selectedExercise.instructions[0]
                  : undefined,
              prescriptionAssistant: metadata?.prescriptionAssistant || selectedExercise.prescriptionAssistant,
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
      instructions: editingExercise.instructions ? [editingExercise.instructions] : [],
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
      defaultUnit: editingExercise.activityType === ActivityType.RESISTANCE ? 'kg' : 'time',
      prescription: editingExercise.prescription,
      instructionMode: editingExercise.instructionMode,
      prescriptionAssistant: editingExercise.prescriptionAssistant
    };

    return (
      <UniversalSetLogger
        exercise={exerciseForLogger}
        onCancel={() => {
          setView('main');
        }}
        onSave={async (sets: ExerciseSet[], metadata?: { prescriptionAssistant?: ExercisePrescriptionAssistantData }) => {
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
              activityType: editingExercise.activityType,
              isWarmup: isWarmupMode,
              prescription: editingExercise.prescription,
              instructionMode: editingExercise.instructionMode,
              instructions: editingExercise.instructions,
              prescriptionAssistant: metadata?.prescriptionAssistant || editingExercise.prescriptionAssistant
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
      <header className="sticky top-0 flex items-center justify-between p-4 bg-bg-secondary border-b border-border">
        <h2 className="text-xl font-bold text-text-primary">
          {editingExercise ? 'Edit Exercise' : 'Add Exercise'}
        </h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
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
            <h3 className="text-lg font-semibold text-text-primary">Quick Add</h3>
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
            <button
              onClick={() => setIsWarmupMode((current) => !current)}
              className={`w-full px-4 py-3 rounded-xl border transition-colors text-left ${
                isWarmupMode
                  ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                  : 'bg-white/10 border-border text-text-primary hover:bg-white/15'
              }`}
            >
              <div className="font-semibold">{isWarmupMode ? '🔥 Warm-up mode enabled' : 'Warm-up mode disabled'}</div>
              <div className="text-sm opacity-80">Logs from this dialog will be saved as warm-up entries.</div>
            </button>
          </section>

          {/* Activity Types Section */}
          <section className="space-y-3 md:space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">Choose Activity Type</h3>
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
                    border border-border
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
                    <div className="text-text-tertiary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3 md:space-y-4 border-t border-border pt-4">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-border text-text-primary hover:bg-white/15 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Create New Exercise
            </button>
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
          searchQuery=""
        />
      )}
    </div>
  );
};

export default LogOptions;







