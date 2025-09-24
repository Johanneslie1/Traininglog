import React from 'react';
import { Program, ProgramSession } from '@/types/program';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';
import ProgramCard from './ProgramCard';
import { usePrograms } from '@/context/ProgramsContext';
import UniversalExercisePicker from '@/components/activities/UniversalExercisePicker';
import { getAllExercisesLocal } from '@/utils/allExercises';
import { enrichAll, collectAllFacets, applyAllFilters } from '@/utils/allExercisesFilters';

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

      return {
        exercise: {
          id: exercise.id,
          name: exercise.name,
          type: 'strength' as const,
          category: 'compound' as const,
          primaryMuscles: [],
          secondaryMuscles: [],
          instructions: [],
          description: exercise.notes || '',
          defaultUnit: 'kg' as const,
          metrics: {
            trackWeight: true,
            trackReps: true,
          }
        },
        sets: [] // Empty sets - will be logged during workout
      };
    }).filter((ex): ex is NonNullable<typeof ex> => ex !== null);

    onSelectExercises(exercisesToAdd);
    onClose();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[#23272F] rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[#23272F] rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-primary text-center">{error}</p>
            <button
              onClick={() => refresh()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[#23272F] rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-text-primary mb-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-text-primary text-center">No programs found. Create a program first.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
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
          id: e.id, 
          name: e.name, 
          type: (e.activityType === ActivityType.RESISTANCE ? 'strength' : 'cardio') as any, 
          category: (e.category || 'general') as any, 
          primaryMuscles: e.primaryMuscles || [], 
          secondaryMuscles: e.secondaryMuscles || [], 
          instructions: [], 
          description: e.description || '', 
          defaultUnit: 'kg' as const, 
          metrics: { 
            trackWeight: e.activityType === ActivityType.RESISTANCE, 
            trackReps: e.activityType === ActivityType.RESISTANCE, 
            trackTime: e.activityType !== ActivityType.RESISTANCE 
          },
          activityType: e.activityType as ActivityType
        } as Exercise, 
        sets: e.activityType === ActivityType.RESISTANCE ? Array(3).fill({ reps: 5, weight: 0, difficulty: 'MODERATE' as const }) : [] 
      })); 
      onSelectExercises(mapped); 
      onClose(); 
    }
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#1a1a1a] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col relative">
          <div className="absolute top-4 left-4 flex gap-2">
            <button onClick={() => setStep('programs')} className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 text-sm">← Back</button>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
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
                  <h3 className="text-lg font-semibold text-white mb-1">{ex.name}</h3>
                  {ex.description && (
                    <p className="text-gray-400 text-xs mb-2 line-clamp-3">{ex.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] rounded">{ex.activityType}</span>
                    {Array.isArray(ex.tags) && ex.tags.slice(0,3).map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-gray-700 text-gray-200 text-[10px] rounded">{t}</span>
                    ))}
                  </div>
                  {active && (
                    <div className="absolute top-1 right-1 text-yellow-400 text-xs font-bold">✓</div>
                  )}
                </div>
              );
            }}
          />
          <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-gray-700 p-4 flex justify-between items-center">
            <p className="text-xs text-gray-400">
              Selected: <span className="text-yellow-400 font-semibold">{selectedCount}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSelectedMap({})} className="px-3 py-2 text-xs font-medium bg-gray-800 border border-gray-600 rounded-md text-gray-300 hover:text-white">
                Clear
              </button>
              <button
                disabled={selectedCount===0}
                onClick={handleAddFromLibrary}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${selectedCount===0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`}
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-start md:items-center justify-center z-50 overflow-y-auto overscroll-contain">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-4xl my-auto flex flex-col relative min-h-0 max-h-[100dvh]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1a1a1a] p-4 md:p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">{step === 'programs' ? 'Select Program' : selectedProgram?.name}</h2>
            <button onClick={() => setStep('library')} className="px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 hover:text-white border border-gray-600 hover:border-yellow-500 text-xs">All Exercises</button>
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
                    className="bg-[#2a2a2a] rounded-xl overflow-hidden"
                  >
                    {/* Session header */}
                    <button
                      onClick={() => toggleSession(session.id)}
                      className="w-full px-4 py-3 md:px-6 md:py-4 flex items-center justify-between hover:bg-[#333] transition-colors"
                    >
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="flex flex-col items-start min-w-0">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {session.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
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
                          className={`w-5 h-5 text-gray-400 transition-transform ${
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
                      <div className="border-t border-white/10">
                        {session.exercises.map((exercise, index) => (
                          <div
                            key={exercise.id}
                            className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 hover:bg-[#333] transition-colors ${
                              index !== session.exercises.length - 1 ? 'border-b border-white/10' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isExerciseSelected(session.id, exercise.id)}
                              onChange={() => handleExerciseToggle(session.id, exercise.id)}
                              className="mt-1 w-5 h-5 rounded border-white/20 bg-[#1a1a1a] checked:bg-purple-600 focus:ring-purple-600"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium">
                                {exercise.name}
                              </h4>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded bg-[#1a1a1a] text-sm text-gray-400">
                                  Sets and reps will be logged during workout
                                </span>
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
        <div className="sticky bottom-0 z-10 bg-[#1a1a1a] p-4 md:p-6 border-t border-white/10 flex items-center justify-between">
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
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            {step === 'programs' ? 'Cancel' : 'Back'}
          </button>
          
          {step === 'sessions' && selectedExercises.length > 0 && (
            <button
              onClick={handleAddSelected}
              className="px-4 py-2 md:px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
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
