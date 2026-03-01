import React, { useState } from 'react';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import CategoryButton, { Category } from '@/features/exercises/CategoryButton';
import ExerciseSearch from '@/features/exercises/ExerciseSearch';
import { ActivityType } from '@/types/activityTypes';
import { getExercisesByActivityType } from '@/services/exerciseDatabaseService';
import UniversalExercisePicker from '@/components/activities/UniversalExercisePicker';
import { enrich as sportEnrich, collectFacets as sportCollectFacets, applyFilters as sportApplyFilters } from '@/utils/sportFilters';
import { CreateUniversalExerciseDialog } from '@/components/exercises/CreateUniversalExerciseDialog';
import { resolveActivityTypeFromExerciseLike } from '@/utils/activityTypeResolver';

/**
 * ProgramAddExerciseOptions
 * Mirrors LogOptions UI but returns selected exercises to SessionBuilder
 */

type ViewState = 'main' | 'resistance' | 'search'
  | 'sport' | 'stretching' | 'endurance' | 'speedAgility' | 'other';

interface ProgramAddExerciseOptionsProps {
  onClose: () => void;
  onAddExercises: (items: { exercise: Exercise; sets: ExerciseSet[] }[]) => void;
  onOpenProgramPicker: () => void;
  onOpenCopyPrevious: () => void;
  onOpenHistory: () => void; // Still required by interface but no longer shown in UI
  onOpenDatabase: () => void; // Still required by interface but no longer shown in UI
}

const helperCategories: Category[] = [
  { id: 'programs', name: 'Add from Program', icon: '📋', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-purple-600', textColor: 'text-text-primary' },
  { id: 'copyPrevious', name: 'Copy from Previous', icon: '📝', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-text-primary' }
  // Removed: 'From History' and 'Exercise Database' - not needed for program sessions
];

const muscleGroups: Category[] = [
  { id: 'chest', name: 'Chest', icon: '💪', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-green-600', textColor: 'text-text-primary' },
  { id: 'back', name: 'Back', icon: '🔙', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-blue-600', textColor: 'text-text-primary' },
  { id: 'legs', name: 'Legs', icon: '🦵', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-yellow-600', textColor: 'text-text-primary' },
  { id: 'shoulders', name: 'Shoulders', icon: '🎯', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-cyan-600', textColor: 'text-text-primary' },
  { id: 'arms', name: 'Arms', icon: '💪', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-red-600', textColor: 'text-text-primary' },
  { id: 'core', name: 'Core', icon: '⭕', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-primary-600', textColor: 'text-text-primary' },
  { id: 'fullBody', name: 'Full-Body', icon: '👤', bgColor: 'bg-gymkeeper-light', iconBgColor: 'bg-orange-600', textColor: 'text-text-primary' },
];

const activityTypes = [
  { id: 'resistance', name: 'Resistance Training', description: 'Weight lifting, strength training', icon: '🏋️‍♂️', bgColor: 'bg-gradient-to-r from-blue-500 to-blue-700', textColor: 'text-text-primary', examples: 'Squats, Deadlifts, Bench Press' },
  { id: 'sport', name: 'Sports', description: 'Team sports, competitions', icon: '⚽', bgColor: 'bg-gradient-to-r from-green-500 to-green-700', textColor: 'text-text-primary', examples: 'Football, Basketball, Tennis' },
  { id: 'stretching', name: 'Stretching & Flexibility', description: 'Mobility, yoga, flexibility', icon: '🧘‍♀️', bgColor: 'bg-gradient-to-r from-purple-500 to-purple-700', textColor: 'text-text-primary', examples: 'Yoga, Static Stretches' },
  { id: 'endurance', name: 'Endurance Training', description: 'Cardio, running, cycling', icon: '🏃‍♂️', bgColor: 'bg-gradient-to-r from-red-500 to-red-700', textColor: 'text-text-primary', examples: 'Running, Cycling, Swimming' },
  { id: 'speedAgility', name: 'Speed, Agility & Plyo', description: 'Sprints, jumps, change of direction', icon: '⚡', bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-600', textColor: 'text-text-primary', examples: 'Ladder, Sprints, Jumps' },
  { id: 'other', name: 'Other Activities', description: 'Custom & misc activities', icon: '🎯', bgColor: 'bg-gradient-to-r from-gray-500 to-gray-700', textColor: 'text-text-primary', examples: 'Meditation, Therapy' }
];

export const ProgramAddExerciseOptions: React.FC<ProgramAddExerciseOptionsProps> = ({
  onClose,
  onAddExercises,
  onOpenProgramPicker,
  onOpenCopyPrevious,
  onOpenHistory: _onOpenHistory, // Not shown in UI for program sessions
  onOpenDatabase: _onOpenDatabase // Not shown in UI for program sessions
}) => {
  const [view, setView] = useState<ViewState>('main');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createDialogActivityType, setCreateDialogActivityType] = useState<ActivityType | undefined>(undefined);

  if (false) { // Removed universal search functionality
    const universalSearchQuery = '';
    const searchResults: any[] = [];
    const setUniversalSearchQuery = (_: string) => {};
    
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-[110]">
        <header className="sticky top-0 flex items-center justify-between p-4 bg-bg-secondary border-b border-border">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setView('main')}
              className="p-2 hover:bg-hover-overlay rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-xl font-bold text-text-primary">🔍 Universal Search</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover-overlay rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
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
                  className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-lg text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </section>
            {universalSearchQuery && universalSearchQuery.length >= 2 && (
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-text-primary">
                  Search Results ({searchResults.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.length > 0 ? (
                    searchResults.slice(0, 20).map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => {
                          // Directly add exercise without set editor
                          const exerciseWithSets = {
                            exercise,
                            sets: [] // Empty sets - will be logged during workout
                          };
                          onAddExercises([exerciseWithSets]);
                        }}
                        className="w-full text-left p-4 bg-bg-secondary rounded-xl hover:bg-bg-tertiary transition-colors border border-border"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-text-primary font-medium">{exercise.name}</h4>
                            <p className="text-text-tertiary text-sm mt-1">
                              {exercise.activityType && `${exercise.activityType} • `}
                              {(exercise.primaryMuscles || []).join(', ') || 'No muscles specified'}
                            </p>
                            {exercise.description && (
                              <p className="text-text-tertiary text-xs mt-1 line-clamp-2">
                                {exercise.description}
                              </p>
                            )}
                          </div>
                          <div className="text-text-muted">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : universalSearchQuery.length > 1 ? (
                    <div className="text-center py-8">
                      <p className="text-text-tertiary">No exercises found for "{universalSearchQuery}"</p>
                      <p className="text-text-muted text-sm mt-2">Try a different search term or create a new exercise</p>
                      <button
                        onClick={() => {
                          setCreateDialogActivityType(ActivityType.RESISTANCE);
                          setShowCreateDialog(true);
                        }}
                        className="mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent-primary text-text-primary font-medium hover:bg-accent-hover transition-colors mx-auto"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Create New Exercise
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-text-tertiary">Type at least 2 characters to search</p>
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

  if (view === 'search') {
    return (
      <ExerciseSearch
        onClose={() => setView('resistance')}
        category={selectedCategory}
        onSelectExercise={(exercise) => {
          // Directly add exercise without set editor
          const exerciseToAdd = {
            ...exercise,
            id: exercise.id || `temp-${exercise.name.toLowerCase().replace(/\s+/g, '-')}`,
            activityType: resolveActivityTypeFromExerciseLike(exercise, { fallback: ActivityType.RESISTANCE })
          };
          const exerciseWithSets = {
            exercise: exerciseToAdd,
            sets: [] // Empty sets - will be logged during workout
          };
          onAddExercises([exerciseWithSets]);
        }}
      />
    );
  }

  const renderActivityPicker = (activity: ActivityType, title: string, subtitle: string) => {
    const data = getExercisesByActivityType(activity) as any[];
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[110]">
        <div className="bg-bg-secondary rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          <button
            onClick={() => setView('main')}
            className="absolute top-4 left-4 px-3 py-1 rounded-md bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary text-sm"
          >← Back</button>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary"
          >✕</button>
          <UniversalExercisePicker
            data={data}
            enrich={sportEnrich as any}
            collectFacets={sportCollectFacets as any}
            applyFilters={sportApplyFilters as any}
            activityType={activity}
            onSelect={(ex) => {
              const exercise: Exercise = {
                ...ex,
                id: ex.id || `temp-${ex.name.toLowerCase().replace(/\s+/g, '-')}`,
                primaryMuscles: ex.primaryMuscles || [],
                secondaryMuscles: ex.secondaryMuscles || [],
                instructions: ex.instructions || [],
                metrics: ex.metrics || {},
                defaultUnit: ex.defaultUnit || 'time',
                activityType: resolveActivityTypeFromExerciseLike(ex, { fallback: activity })
              };
              onAddExercises([{ exercise, sets: [] }]);
              onClose();
            }}
            title={title}
            subtitle={subtitle}
          />
        </div>
      </div>
    );
  };

  if (view === 'sport') return renderActivityPicker(ActivityType.SPORT, 'Sports Activities', 'Browse sports & drills');
  if (view === 'stretching') return renderActivityPicker(ActivityType.STRETCHING, 'Stretching & Flexibility', 'Mobility & flexibility exercises');
  if (view === 'endurance') return renderActivityPicker(ActivityType.ENDURANCE, 'Endurance Training', 'Cardio & endurance activities');
  if (view === 'speedAgility') return renderActivityPicker(ActivityType.SPEED_AGILITY, 'Speed & Agility', 'Plyometrics & agility drills');
  if (view === 'other') return renderActivityPicker(ActivityType.OTHER, 'Other Activities', 'Miscellaneous & custom activities');

  if (view === 'resistance') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-[110]">
        <header className="sticky top-0 flex items-center justify-between p-4 bg-bg-secondary border-b border-border">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setView('main')}
              className="p-2 hover:bg-hover-overlay rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-xl font-bold text-text-primary">🏋️‍♂️ Resistance Training</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover-overlay rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto overscroll-contain pb-safe min-h-0">
          <div className="max-w-md mx-auto p-4 space-y-6 md:space-y-8">
            <section className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search exercises..."
                  className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-lg text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onFocus={() => { setSelectedCategory(null); setView('search'); }}
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button
                onClick={() => {
                  setCreateDialogActivityType(ActivityType.RESISTANCE);
                  setShowCreateDialog(true);
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-accent-primary text-text-primary font-medium hover:bg-accent-hover transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Create Custom Exercise
              </button>
            </section>
            <section className="space-y-3 md:space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Muscle Groups</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
                {muscleGroups.map(category => (
                  <CategoryButton
                    key={category.id}
                    category={category}
                    onClick={() => { setSelectedCategory(category); setView('search'); }}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-[110]">
      <header className="sticky top-0 flex items-center justify-between p-4 bg-bg-secondary border-b border-border">
        <h2 className="text-xl font-bold text-text-primary">Add Exercise</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-hover-overlay rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>
      <main className="flex-1 overflow-y-auto overscroll-contain pb-safe min-h-0">
        <div className="max-w-md mx-auto p-4 space-y-6 md:space-y-8">
          <section className="space-y-3 md:space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">Quick Add</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {helperCategories.map(category => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  onClick={() => {
                    if (category.id === 'programs') onOpenProgramPicker();
                    else if (category.id === 'copyPrevious') onOpenCopyPrevious();
                  }}
                />
              ))}
            </div>
          </section>
          <section className="space-y-3 md:space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">Choose Activity Type</h3>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {activityTypes.map(a => (
                <div key={a.id} className="space-y-2">
                  <div
                    onClick={() => setView(a.id as ViewState)}
                    className={`${a.bgColor} rounded-xl p-4 cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg active:scale-95 border border-border`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{a.icon}</div>
                      <div className="flex-1">
                        <h4 className={`font-semibold text-lg ${a.textColor}`}>{a.name}</h4>
                        <p className={`text-sm opacity-90 ${a.textColor}`}>{a.description}</p>
                        <p className={`text-xs opacity-75 mt-1 ${a.textColor}`}>{a.examples}</p>
                      </div>
                      <div className="text-text-tertiary"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setCreateDialogActivityType(undefined);
                setShowCreateDialog(true);
              }}
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
          activityType={createDialogActivityType}
          searchQuery=""
        />
      )}
    </div>
  );
};

export default ProgramAddExerciseOptions;

