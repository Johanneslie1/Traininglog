import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { ExerciseSet, Exercise } from '@/types/exercise';
import ExerciseSearch from '../exercises/ExerciseSearch';
import { ExerciseSetLogger } from '../exercises/ExerciseSetLogger';
import Calendar from '../exercises/Calendar';
import { ExerciseDataService, ExerciseData } from '@/services/exerciseDataService';

export type ExerciseWithSets = Exercise & { sets: ExerciseSet[] };

interface Category {
  id: string;
  name: string;
  icon: string;
  iconBgColor: string;
  // Optionally add bgColor/textColor if needed for future
}

const muscleGroups: Category[] = [
  { id: 'chest', name: 'Chest', icon: '💪', iconBgColor: 'bg-green-600' },
  { id: 'back', name: 'Back', icon: '🔙', iconBgColor: 'bg-blue-600' },
  { id: 'legs', name: 'Legs', icon: '🦵', iconBgColor: 'bg-yellow-600' },
  { id: 'shoulders', name: 'Shoulders', icon: '🎯', iconBgColor: 'bg-cyan-600' },
  { id: 'arms', name: 'Arms', icon: '💪', iconBgColor: 'bg-red-600' },
  { id: 'core', name: 'Core', icon: '⭕', iconBgColor: 'bg-primary-600' },
  { id: 'fullBody', name: 'Full-Body', icon: '👤', iconBgColor: 'bg-orange-600' },
];

const trainingTypes: Category[] = [
  { id: 'cardio', name: 'Cardio', icon: '🏃', iconBgColor: 'bg-red-600' },
  { id: 'agility', name: 'Agility', icon: '⚡', iconBgColor: 'bg-yellow-600' },
  { id: 'speed', name: 'Speed', icon: '🏃‍♂️', iconBgColor: 'bg-blue-600' },
  { id: 'stretching', name: 'Stretching', icon: '🧘‍♂️', iconBgColor: 'bg-green-600' },
];

interface SessionExerciseLogOptionsProps {
  onClose: () => void;
  onSave: (exercise: ExerciseWithSets) => void;
  onCopyFromAnotherDay?: () => void;
  onCopyPreviousSession?: () => void;
}

const SessionExerciseLogOptions: React.FC<SessionExerciseLogOptionsProps> = ({ onClose, onSave, onCopyFromAnotherDay, onCopyPreviousSession }) => {
  const [step, setStep] = useState<'options' | 'calendar' | 'selectExercises' | 'search' | 'setLogger'>('options');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [calendarExercises, setCalendarExercises] = useState<ExerciseData[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const { user } = useSelector((state: any) => state.auth);

  // Step 1: Show options and categories
  if (step === 'options') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button onClick={() => setStep('calendar')} className="bg-[#1f2e24] p-4 rounded-xl flex flex-col items-center">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-2">
              <span className="text-white text-2xl">📅</span>
            </div>
            <div className="text-green-400 font-medium">From another day</div>
          </button>
          <button onClick={onCopyPreviousSession} className="bg-[#1f1f2e] p-4 rounded-xl flex flex-col items-center">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-2">
              <span className="text-white text-2xl">📋</span>
            </div>
            <div className="text-purple-400 font-medium">Copy Previous Session</div>
          </button>
        </div>
        <div>
          <h2 className="text-lg font-medium text-white mb-3">Muscle Groups</h2>
          <div className="grid grid-cols-2 gap-3">
            {muscleGroups.map((category) => (
              <button
                key={category.id}
                onClick={() => { setSelectedCategory(category); setStep('search'); }}
                className="flex items-center p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#222] transition-colors"
              >
                <div className={`w-10 h-10 ${category.iconBgColor} rounded-lg flex items-center justify-center mr-3`}>
                  <span className="text-lg">{category.icon}</span>
                </div>
                <span className="text-white">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-medium text-white mb-3">Training Types</h2>
          <div className="grid grid-cols-2 gap-3">
            {trainingTypes.map((category) => (
              <button
                key={category.id}
                onClick={() => { setSelectedCategory(category); setStep('search'); }}
                className="flex items-center p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#222] transition-colors"
              >
                <div className={`w-10 h-10 ${category.iconBgColor} rounded-lg flex items-center justify-center mr-3`}>
                  <span className="text-lg">{category.icon}</span>
                </div>
                <span className="text-white">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Show calendar to pick a day
  if (step === 'calendar') {
    return (
      <Calendar
        selectedDate={calendarDate}
        onClose={() => setStep('options')}
        onSelectExercises={async (exercises: ExerciseData[]) => {
          setCalendarExercises(exercises);
          setSelectedExercises(new Set());
          setStep('selectExercises');
        }}
        onDateSelect={date => setCalendarDate(date)}
      />
    );
  }

  // Step 3: Select exercises from chosen day
  if (step === 'selectExercises') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-white mb-2">Select exercises to add</h2>
        <div className="max-h-64 overflow-y-auto">
          {calendarExercises.length === 0 && <div className="text-gray-400">No exercises found for this day.</div>}
          {calendarExercises.map(ex => (
            <label key={ex.id} className="flex items-center gap-2 p-2 bg-[#23272F] rounded mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedExercises.has(ex.id || '')}
                onChange={() => {
                  const id = ex.id || '';
                  setSelectedExercises(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                  });
                }}
              />
              <span className="text-white">{ex.exerciseName}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 bg-gray-700 text-white rounded" onClick={() => setStep('calendar')}>Back</button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded"
            onClick={() => {
              const selected = calendarExercises.filter(ex => selectedExercises.has(ex.id || ''));
              selected.forEach(ex => {
                // Map ExerciseData to ExerciseWithSets (fill missing fields with defaults)
                onSave({
                  id: ex.id || '',
                  name: ex.exerciseName,
                  description: '',
                  type: 'strength',
                  category: 'compound',
                  primaryMuscles: [],
                  secondaryMuscles: [],
                  equipment: [],
                  instructions: [],
                  tips: [],
                  videoUrl: '',
                  imageUrl: '',
                  defaultUnit: 'kg',
                  metrics: {},
                  sets: ex.sets || [],
                });
              });
              setStep('options');
            }}
            disabled={selectedExercises.size === 0}
          >
            Add Selected
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Search for exercise
  if (step === 'search' && selectedCategory) {
    return (
      <ExerciseSearch
        category={{ ...selectedCategory, bgColor: '', textColor: '' }}
        onClose={() => setStep('options')}
        onSelectExercise={(exercise) => { setCurrentExercise(exercise as Exercise); setStep('setLogger'); }}
      />
    );
  }

  // Step 3: Set logger
  if (step === 'setLogger' && currentExercise) {
    return (
      <ExerciseSetLogger
        exercise={{ ...currentExercise, sets: [] }}
        onSave={(sets) => onSave({ ...currentExercise, sets })}
        onCancel={() => setStep('search')}
      />
    );
  }

  return null;
};

export default SessionExerciseLogOptions;
