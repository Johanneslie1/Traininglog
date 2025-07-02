import React, { useState } from 'react';
import { Program, ProgramSession } from '@/types/program';
import { Exercise, ExerciseSet } from '@/types/exercise';
import ProgramCard from './ProgramCard';
import { usePrograms } from '@/context/ProgramsContext';

interface ProgramExercisePickerProps {
  onClose: () => void;
  onSelectExercises: (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => void;
}

export const ProgramExercisePicker: React.FC<ProgramExercisePickerProps> = ({
  onClose,
  onSelectExercises
}) => {
  const { programs } = usePrograms();
  const [step, setStep] = useState<'programs' | 'sessions' | 'exercises'>('programs');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<{ sessionId: string; exerciseId: string }[]>([]);

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
        sets: Array(exercise.sets).fill({
          reps: exercise.reps,
          weight: exercise.weight || 0,
          difficulty: 'MODERATE' as const
        })
      };
    }).filter((ex): ex is NonNullable<typeof ex> => ex !== null);

    onSelectExercises(exercisesToAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {step === 'programs' && 'Select Program'}
              {step === 'sessions' && selectedProgram?.name}
            </h2>
            <p className="text-gray-400 mt-1">
              {step === 'programs' && 'Choose a workout program to add exercises from'}
              {step === 'sessions' && `${selectedExercises.length} exercises selected`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'programs' && (
            <>
              {/* Programs grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {programs.map(program => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    onClick={handleProgramSelect}
                  />
                ))}
              </div>
            </>
          )}

          {step === 'sessions' && selectedProgram?.sessions && (
            <div className="space-y-4">
              {selectedProgram.sessions.map(session => (
                <div 
                  key={session.id}
                  className="bg-[#2a2a2a] rounded-xl overflow-hidden"
                >
                  {/* Session header */}
                  <button
                    onClick={() => toggleSession(session.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#333] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-start">
                        <h3 className="text-lg font-semibold text-white">
                          {session.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-gray-400">
                          {session.exercises.length} exercises
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAllInSession(session.id, session.exercises);
                        }}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
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
                          className={`flex items-start gap-4 p-4 hover:bg-[#333] transition-colors ${
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
                              {exercise.sets > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-[#1a1a1a] text-sm text-gray-400">
                                  {exercise.sets} sets
                                </span>
                              )}
                              {exercise.reps > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-[#1a1a1a] text-sm text-gray-400">
                                  {exercise.reps} reps
                                </span>
                              )}
                              {exercise.weight && (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-[#1a1a1a] text-sm text-gray-400">
                                  {exercise.weight} kg
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

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
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
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
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
