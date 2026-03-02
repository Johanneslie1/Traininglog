import React from 'react';
import { Program, ProgramSession } from '@/types/program';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import { formatPrescriptionBadge } from '@/utils/prescriptionUtils';
import { resolveActivityTypeFromExerciseLike } from '@/utils/activityTypeResolver';
import ProgramCard from './ProgramCard';
import { usePrograms } from '@/context/ProgramsContext';
import UniversalExercisePicker from '@/components/activities/UniversalExercisePicker';
import { getAllExercisesLocal } from '@/utils/allExercises';
import { enrichAll, collectAllFacets, applyAllFilters } from '@/utils/allExercisesFilters';

const mapActivityTypeToExerciseType = (activityType: ActivityType): Exercise['type'] => {
  switch (activityType) {
    case ActivityType.RESISTANCE:
      return 'strength';
    case ActivityType.ENDURANCE:
      return 'endurance';
    case ActivityType.STRETCHING:
      return 'flexibility';
    case ActivityType.SPORT:
      return 'teamSports';
    case ActivityType.SPEED_AGILITY:
      return 'speedAgility';
    case ActivityType.OTHER:
    default:
      return 'other';
  }
};

interface ProgramExercisePickerProps {
  onClose: () => void;
  onSelectExercises: (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => void;
}

export const ProgramExercisePicker: React.FC<ProgramExercisePickerProps> = ({
  onClose,
  onSelectExercises
}) => {
  const { programs, isLoading, error, refresh } = usePrograms();
  const [step, setStep] = React.useState<'programs' | 'sessions' | 'exercises' | 'library'>('programs');
  const [selectedProgram, setSelectedProgram] = React.useState<Program | null>(null);
  const [expandedSessions, setExpandedSessions] = React.useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = React.useState<{ sessionId: string; exerciseId: string }[]>([]);

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program);
    setStep('sessions');
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const isExerciseSelected = (sessionId: string, exerciseId: string) => {
    return selectedExercises.some(sel => 
      sel.sessionId === sessionId && sel.exerciseId === exerciseId
    );
  };

  const handleExerciseToggle = (sessionId: string, exerciseId: string) => {
    setSelectedExercises(prev => {
      const isSelected = isExerciseSelected(sessionId, exerciseId);
      if (isSelected) {
        return prev.filter(sel => 
          !(sel.sessionId === sessionId && sel.exerciseId === exerciseId)
        );
      } else {
        return [...prev, { sessionId, exerciseId }];
      }
    });
  };

  const handleSelectAllInSession = (sessionId: string, exercises: ProgramSession['exercises']) => {
    setSelectedExercises(prev => {
      const currentSessionSelections = prev.filter(sel => sel.sessionId === sessionId);
      if (currentSessionSelections.length === exercises.length) {
        // Deselect all in this session
        return prev.filter(sel => sel.sessionId !== sessionId);
      } else {
        // Select all in this session
        const sessionExercises = exercises.map(ex => ({
          sessionId,
          exerciseId: ex.id
        }));
        return [...prev.filter(sel => sel.sessionId !== sessionId), ...sessionExercises];
      }
    });
  };

  const handleAddSelected = () => {
    if (!selectedProgram) return;
    
    const exercisesToAdd = selectedExercises.map(sel => {
      const session = selectedProgram.sessions?.find(s => s.id === sel.sessionId);
      const exercise = session?.exercises.find(e => e.id === sel.exerciseId);
      
      if (!exercise) return null;

      // Keep logger fast: import with a single editable default row from logger initialization.
      // Prescription and assistant metadata stay on exercise for guide/hints.
      const sets: ExerciseSet[] = [];

      const activityType = resolveActivityTypeFromExerciseLike(exercise, { fallback: ActivityType.RESISTANCE });
      const isResistance = activityType === ActivityType.RESISTANCE;

      return {
        exercise: {
          id: exercise.id,
          name: exercise.name,
          type: mapActivityTypeToExerciseType(activityType),
          category: 'compound' as const,
          primaryMuscles: [],
          secondaryMuscles: [],
          instructions: exercise.instructions ? [exercise.instructions] : [],
          description: exercise.notes || '',
          defaultUnit: isResistance ? ('kg' as const) : ('time' as const),
          metrics: {
            trackWeight: isResistance,
            trackReps: isResistance,
            trackTime: !isResistance,
          },
          activityType,
          isWarmup: session?.isWarmupSession === true,
          // Include prescription data for logger components
          prescription: exercise.prescription,
          instructionMode: exercise.instructionMode,
        },
        sets
      };
    }).filter((ex): ex is NonNullable<typeof ex> => ex !== null);

    onSelectExercises(exercisesToAdd);
    onClose();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-center justify-center">
        <div className="bg-bg-secondary rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="text-text-primary">Loading programs...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-center justify-center">
        <div className="bg-bg-secondary rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-primary text-center">{error}</p>
            <button
              onClick={() => refresh()}
              className="px-4 py-2 bg-primary text-text-primary rounded-lg hover:bg-primary-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render no programs state
  if (programs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-center justify-center">
        <div className="bg-bg-secondary rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-text-primary mb-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-text-primary text-center">No programs found. Create a program first.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-text-primary rounded-lg hover:bg-primary-dark transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'library') {
    const unified = React.useMemo(() => getAllExercisesLocal(), []);
    const enriched = React.useMemo(() => enrichAll(unified), [unified]);
    const [selectedMap, setSelectedMap] = React.useState<Record<string, boolean>>({});
    const selectedCount = Object.values(selectedMap).filter(Boolean).length;
    function toggleSelect(ex: any) { setSelectedMap(prev => ({ ...prev, [ex.id]: !prev[ex.id] })); }
    function handleAddFromLibrary() { 
      const chosen = enriched.filter(e => selectedMap[e.id]); 
      const mapped = chosen.map(e => ({ 
        exercise: {
          ...(e as any),
          id: e.id, 
          name: e.name, 
          type: mapActivityTypeToExerciseType(normalizeActivityType(e.activityType as ActivityType)),
          category: (e.category || 'general') as any, 
          primaryMuscles: e.primaryMuscles || [], 
          secondaryMuscles: e.secondaryMuscles || [], 
          instructions: Array.isArray((e as any).instructions) ? (e as any).instructions : [], 
          description: e.description || '', 
          defaultUnit: normalizeActivityType(e.activityType as ActivityType) === ActivityType.RESISTANCE ? ('kg' as const) : ('time' as const), 
          metrics: { 
            trackWeight: normalizeActivityType(e.activityType as ActivityType) === ActivityType.RESISTANCE, 
            trackReps: normalizeActivityType(e.activityType as ActivityType) === ActivityType.RESISTANCE, 
            trackTime: normalizeActivityType(e.activityType as ActivityType) !== ActivityType.RESISTANCE 
          },
          activityType: normalizeActivityType(e.activityType as ActivityType)
        } as Exercise, 
        sets: normalizeActivityType(e.activityType as ActivityType) === ActivityType.RESISTANCE ? Array(3).fill({ reps: 5, weight: 0, difficulty: 'MODERATE' as const }) : [] 
      })); 
      onSelectExercises(mapped); 
      onClose(); 
    }
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[120]">
        <div className="bg-bg-secondary rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col relative">
          <div className="absolute top-4 left-4 flex gap-2">
            <button onClick={() => setStep('programs')} className="px-3 py-1 rounded-md bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary text-sm">← Back</button>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary">✕</button>
          <UniversalExercisePicker
            data={enriched as any[]}
            enrich={(l: any[]) => l}
            collectFacets={(l: any[]) => collectAllFacets(l)}
            applyFilters={(l: any[], f: any) => applyAllFilters(l, f)}
            onSelect={toggleSelect}
            title="All Exercises Library"
            subtitle="Select one or many exercises from any category"
            renderCard={(ex: any) => {
              const active = !!selectedMap[ex.id];
              return (
                <div className={`relative ${active ? 'ring-2 ring-yellow-400' : ''}`}>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">{ex.name}</h3>
                  {ex.description && (
                    <p className="text-text-tertiary text-xs mb-2 line-clamp-3">{ex.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-purple-600 text-text-primary text-[10px] rounded">{ex.activityType}</span>
                    {Array.isArray(ex.tags) && ex.tags.slice(0,3).map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-bg-tertiary text-gray-200 text-[10px] rounded">{t}</span>
                    ))}
                  </div>
                  {active && (
                    <div className="absolute top-1 right-1 text-yellow-400 text-xs font-bold">✓</div>
                  )}
                </div>
              );
            }}
          />
          <div className="sticky bottom-0 bg-bg-secondary border-t border-gray-700 p-4 flex justify-between items-center">
            <p className="text-xs text-text-tertiary">
              Selected: <span className="text-yellow-400 font-semibold">{selectedCount}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSelectedMap({})} className="px-3 py-2 text-xs font-medium bg-bg-tertiary border border-gray-600 rounded-md text-text-secondary hover:text-text-primary">
                Clear
              </button>
              <button
                disabled={selectedCount===0}
                onClick={handleAddFromLibrary}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${selectedCount===0 ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`}
              >
                Add {selectedCount || ''} to Program
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-start md:items-center justify-center z-[120] overflow-y-auto overscroll-contain">
      <div className="bg-bg-secondary rounded-xl w-full max-w-4xl my-auto flex flex-col relative min-h-0 max-h-[100dvh]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg-secondary p-4 md:p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">{step === 'programs' ? 'Select Program' : selectedProgram?.name}</h2>
            <button onClick={() => setStep('library')} className="px-3 py-1.5 rounded-md bg-bg-tertiary text-text-secondary hover:text-text-primary border border-gray-600 hover:border-yellow-500 text-xs">All Exercises</button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="p-4 md:p-6 space-y-4">
            {step === 'programs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {programs.map(program => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    onClick={() => handleProgramSelect(program)}
                  />
                ))}
              </div>
            )}

            {step === 'sessions' && selectedProgram && (
              <div className="space-y-3 md:space-y-4">
                {selectedProgram.sessions?.map(session => (
                  <div 
                    key={session.id}
                    className="bg-bg-tertiary rounded-xl overflow-hidden"
                  >
                    {/* Session header */}
                    <button
                      onClick={() => toggleSession(session.id)}
                      className="w-full px-4 py-3 md:px-6 md:py-4 flex items-center justify-between hover:bg-bg-tertiary transition-colors"
                    >
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="flex flex-col items-start min-w-0">
                          <h3 className="text-lg font-semibold text-text-primary truncate">
                            {session.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-text-tertiary">
                            {session.exercises.length} exercises
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAllInSession(session.id, session.exercises);
                          }}
                          className="text-sm text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap px-2"
                        >
                          {selectedExercises.filter(sel => sel.sessionId === session.id).length === session.exercises.length
                            ? 'Deselect All'
                            : 'Select All'
                          }
                        </button>
                        <svg
                          className={`w-5 h-5 text-text-tertiary transition-transform ${
                            expandedSessions.includes(session.id) ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Exercises list */}
                    {expandedSessions.includes(session.id) && (
                      <div className="border-t border-border">
                        {session.exercises.map((exercise, index) => (
                          <div
                            key={exercise.id}
                            className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 hover:bg-bg-tertiary transition-colors ${
                              index !== session.exercises.length - 1 ? 'border-b border-border' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isExerciseSelected(session.id, exercise.id)}
                              onChange={() => handleExerciseToggle(session.id, exercise.id)}
                              className="mt-1 w-5 h-5 rounded border-white/20 bg-bg-secondary checked:bg-accent-primary focus:ring-accent-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-text-primary font-medium">
                                {exercise.name}
                              </h4>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {exercise.prescription && exercise.instructionMode === 'structured' ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-sm">
                                    📋 {formatPrescriptionBadge(exercise.prescription, normalizeActivityType(exercise.activityType))}
                                  </span>
                                ) : exercise.instructions && exercise.instructionMode === 'freeform' ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-sm italic">
                                    {exercise.instructions}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-bg-secondary text-sm text-text-tertiary">
                                    Sets and reps will be logged during workout
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-bg-secondary p-4 md:p-6 border-t border-border flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 'sessions') {
                setStep('programs');
                setSelectedProgram(null);
                setSelectedExercises([]);
                setExpandedSessions([]);
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 text-text-tertiary hover:text-text-primary transition-colors"
          >
            {step === 'programs' ? 'Cancel' : 'Back'}
          </button>
          
          {step === 'sessions' && selectedExercises.length > 0 && (
            <button
              onClick={handleAddSelected}
              className="px-4 py-2 md:px-6 bg-accent-primary text-text-primary rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Selected ({selectedExercises.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramExercisePicker;

