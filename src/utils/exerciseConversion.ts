import { ExerciseLog } from '@/types/exercise';
import { Program, ProgramSession, ProgramExercise } from '@/types/program';
import { ExerciseSet } from '@/types/sets';
import { Exercise } from '@/types/exercise';
import { convertWeight } from './weightConversion';

// Template interface (matches TemplateManager)
interface Template {
  id: string;
  name: string;
  exercises: { exercise: Exercise; sets: ExerciseSet[] }[];
  createdAt: string;
}

/**
 * Convert all weights in exercise logs from one unit to another
 */
export const convertExerciseLogsUnits = (
  logs: ExerciseLog[], 
  fromUnit: 'kg' | 'lb', 
  toUnit: 'kg' | 'lb'
): ExerciseLog[] => {
  if (fromUnit === toUnit) return logs;

  return logs.map(log => ({
    ...log,
    sets: log.sets.map(set => ({
      ...set,
      weight: set.weight !== undefined ? convertWeight(set.weight, fromUnit, toUnit) : 0
    }))
  }));
};

/**
 * Convert program exercise weights
 */
export const convertProgramExerciseWeight = (
  weight: number | undefined,
  fromUnit: 'kg' | 'lb',
  toUnit: 'kg' | 'lb'
): number | undefined => {
  if (!weight || fromUnit === toUnit) return weight;
  return convertWeight(weight, fromUnit, toUnit);
};

/**
 * Convert all weights in a single program exercise
 */
export const convertProgramExercise = (
  exercise: ProgramExercise,
  fromUnit: 'kg' | 'lb',
  toUnit: 'kg' | 'lb'
): ProgramExercise => {
  if (fromUnit === toUnit) return exercise;

  return {
    ...exercise,
    weight: exercise.weight ? convertWeight(exercise.weight, fromUnit, toUnit) : exercise.weight,
    setsData: exercise.setsData?.map(set => ({
      ...set,
      weight: set.weight !== undefined ? convertWeight(set.weight, fromUnit, toUnit) : 0
    }))
  };
};

/**
 * Convert all weights in a program session
 */
export const convertProgramSession = (
  session: ProgramSession,
  fromUnit: 'kg' | 'lb',
  toUnit: 'kg' | 'lb'
): ProgramSession => {
  if (fromUnit === toUnit) return session;

  return {
    ...session,
    exercises: session.exercises.map(exercise => 
      convertProgramExercise(exercise, fromUnit, toUnit)
    )
  };
};

/**
 * Convert all weights in a program
 */
export const convertProgram = (
  program: Program,
  fromUnit: 'kg' | 'lb',
  toUnit: 'kg' | 'lb'
): Program => {
  if (fromUnit === toUnit) return program;

  return {
    ...program,
    sessions: program.sessions.map(session => 
      convertProgramSession(session, fromUnit, toUnit)
    )
  };
};

/**
 * Convert all weights in an array of programs
 */
export const convertPrograms = (
  programs: Program[],
  fromUnit: 'kg' | 'lb',
  toUnit: 'kg' | 'lb'
): Program[] => {
  if (fromUnit === toUnit) return programs;

  return programs.map(program => convertProgram(program, fromUnit, toUnit));
};

/**
 * Convert all weights in a single template
 */
export const convertTemplate = (
  template: Template,
  fromUnit: 'kg' | 'lb',
  toUnit: 'kg' | 'lb'
): Template => {
  if (fromUnit === toUnit) return template;

  return {
    ...template,
    exercises: template.exercises.map(exerciseData => ({
      ...exerciseData,
      sets: exerciseData.sets.map(set => ({
        ...set,
        weight: set.weight !== undefined ? convertWeight(set.weight, fromUnit, toUnit) : 0
      }))
    }))
  };
};

/**
 * Convert all weights in an array of templates
 */
export const convertTemplates = (
  templates: Template[],
  fromUnit: 'kg' | 'lb',
  toUnit: 'kg' | 'lb'
): Template[] => {
  if (fromUnit === toUnit) return templates;

  return templates.map(template => convertTemplate(template, fromUnit, toUnit));
};
