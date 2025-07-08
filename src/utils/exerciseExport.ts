import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { Session, DifficultyCategory } from '@/types/session';
import { saveAs } from 'file-saver';

export type DifficultyLevel = DifficultyCategory;

export const difficultyToRPE: Record<DifficultyLevel, number> = {
  warmUp: 3,
  easy: 5,
  moderate: 7,
  hard: 8,
  failure: 9,
  dropSet: 10,
};

interface ExportSet {
  rpe: number;
  weight?: number;
  reps?: number;
  difficulty?: DifficultyLevel;
  userEmail: string;
  exerciseName: string;
  timestamp: string;
  sessionId: string;
  setNumber: number;
}

export const convertDifficultyToRPE = (difficulty: DifficultyLevel): number => {
  return difficultyToRPE[difficulty] || 7; // Default to moderate (7) if difficulty is unknown
};

export const prepareExportData = (
  session: Session,
  exercises: Record<string, Exercise>,
  userEmail: string,
): ExportSet[] => {
  const exportSets: ExportSet[] = [];
  
  session.exercises.forEach((exercise, exerciseIndex) => {
    exercise.sets.forEach((set, setIndex) => {
      exportSets.push({
        setNumber: setIndex + 1,
        rpe: set.difficulty ? convertDifficultyToRPE(set.difficulty) : 7,
        weight: set.weight,
        reps: set.reps,
        difficulty: set.difficulty,
        userEmail,
        exerciseName: exercises[exercise.exerciseId]?.name || 'Unknown Exercise',
        timestamp: session.date,
        sessionId: session.id
      });
    });
  });
  
  return exportSets;
};

export const exportToJSON = (
  session: Session,
  exercises: Record<string, Exercise>,
  userEmail: string
): void => {
  const exportData = prepareExportData(session, exercises, userEmail);
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  saveAs(blob, `training_log_${new Date().toISOString().split('T')[0]}.json`);
};

export const exportToCSV = (
  session: Session,
  exercises: Record<string, Exercise>,
  userEmail: string
): void => {
  const exportData = prepareExportData(session, exercises, userEmail);
  
  // Define CSV headers
  const headers = [
    'Date',
    'Exercise',
    'Sets',
    'Reps',
    'Weight',
    'Difficulty',
    'RPE',
    'User',
    'Session ID'
  ];

  // Convert data to CSV rows
  const csvRows = [
    headers.join(','),
    ...exportData.map(set => [
      set.timestamp,
      set.exerciseName,
      set.setNumber,
      set.reps,
      set.weight,
      set.difficulty,
      set.rpe,
      set.userEmail,
      set.sessionId
    ].join(','))
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `training_log_${new Date().toISOString().split('T')[0]}.csv`);
};
