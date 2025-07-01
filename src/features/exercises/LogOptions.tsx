import React, { useState } from 'react';
import ExerciseModal from '@/components/exercises/ExerciseModal';
import { ExerciseHistory } from './ExerciseHistory';
import CopyFromPreviousSessionDialog from './CopyFromPreviousSessionDialog';
import { usePrograms } from '@/context/ProgramsContext';
import { allExercises } from '@/data/exercises';
import { saveExerciseLog, deleteExerciseLog, getExerciseLogsByDate } from '@/utils/localStorageUtils';
import { v4 as uuidv4 } from 'uuid';
import { DifficultyCategory, ExerciseLog as ExerciseLogType, ExerciseSet } from '@/types/exercise';

// Define available views
type ViewType = 'main' | 'categories' | 'exercises' | 'search' | 'history' | 'copy' | 'program' | 'exerciseList' | 'editExercise';

// Define category metadata
const CATEGORIES_META = [
  { key: 'chest', label: 'Chest', icon: '💪', color: 'text-red-500' },
  { key: 'arms', label: 'Arms', icon: '💪', color: 'text-blue-500' },
  { key: 'back', label: 'Back', icon: '🔙', color: 'text-green-500' },
  { key: 'legs', label: 'Legs', icon: '🦵', color: 'text-yellow-500' },
  { key: 'shoulders', label: 'Shoulders', icon: '🏋️', color: 'text-purple-500' },
  { key: 'core', label: 'Core', icon: '⭕', color: 'text-orange-500' },
  { key: 'cardio', label: 'Cardio', icon: '🏃', color: 'text-pink-500' },
  { key: 'stretching', label: 'Stretching', icon: '🧘', color: 'text-indigo-500' },
  { key: 'mobility', label: 'Mobility', icon: '🔄', color: 'text-teal-500' }
];

type Exercise = {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  category?: string;
  equipment?: string[];
  description?: string;
};

type LogOptionsProps = {
  onClose: () => void;
  onExerciseAdded?: () => Promise<void>;
  onCopyFromPrevious: () => void;
  selectedDate?: Date; // Add selectedDate prop
};

const LogOptions: React.FC<LogOptionsProps> = ({ 
  onClose, 
  onExerciseAdded, 
  onCopyFromPrevious,
  selectedDate = new Date() // Default to current date if not provided
}) => {
  const [view, setView] = useState<ViewType>('main');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  // Store comment as a custom field, but not in ExerciseSet type
  const defaultSet = { reps: 8, weight: 0, difficulty: DifficultyCategory.NORMAL, _comment: '' };
  const [editSets, setEditSets] = useState<any[]>([defaultSet]);
  const [editingLogId, setEditingLogId] = useState<string | null>(null); // For editing
  const { programs } = usePrograms();

  // Handler for when exercises are selected from another day
  const handleExercisesCopied = async () => {
    setView('main');
    await onExerciseAdded?.();
  };

  // Handler for when exercises are selected from a program
  const handleProgramExerciseAdd = () => {
    setView('main');
    onExerciseAdded?.();
  };

  // --- Robust category filter and search logic ---
  function normalize(str: string) {
    return (str || '').toLowerCase().replace(/[-_\s]/g, '');
  }

  // Map of category keys to aliases
  const CATEGORY_ALIASES: Record<string, string[]> = {
    chest: ['chest', 'pectorals', 'pecs'],
    arms: ['arms', 'biceps', 'triceps', 'forearms'],
    back: ['back', 'lats', 'latissimus', 'latissimusdorsi', 'trapezius', 'traps', 'rhomboids', 'erectorspinae'],
    legs: ['legs', 'quads', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
    shoulders: ['shoulders', 'deltoids', 'delts'],
    core: ['core', 'abs', 'abdominals', 'obliques', 'lowerback'],
    full_body: ['fullbody', 'full-body', 'totalbody', 'total-body', 'compound'],
  };

  // Map category to all muscle groups that should be included for that category
  const CATEGORY_MUSCLES: Record<string, string[]> = {
    chest: ['chest', 'pectorals', 'pecs'],
    arms: ['biceps', 'triceps', 'forearms'],
    back: ['back', 'lats', 'latissimus dorsi', 'trapezius', 'traps', 'rhomboids', 'erector spinae'],
    legs: ['quadriceps', 'quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
    shoulders: ['shoulders', 'deltoids', 'delts'],
    core: ['core', 'abs', 'abdominals', 'obliques', 'lower back', 'lower_back'],
    full_body: ['full_body', 'full body', 'compound'],
  };

  function matchesCategory(ex: any, categoryKey: string) {
    const aliases = CATEGORY_ALIASES[categoryKey] || [categoryKey];
    const muscleSet = new Set((CATEGORY_MUSCLES[categoryKey] || []).map(normalize));
    // Check category property
    if (ex.category && aliases.some(a => normalize(ex.category).includes(normalize(a)))) return true;
    // Check primary/secondary muscles for any match in the muscle set
    const allMuscles = [
      ...(ex.primaryMuscles || []),
      ...(ex.secondaryMuscles || []),
    ];
    if (allMuscles.some(m => muscleSet.has(normalize(m)))) return true;
    // Also allow alias/partial matches for robustness
    if (allMuscles.some(muscle => aliases.some(a => normalize(muscle).includes(normalize(a)) || normalize(a).includes(normalize(muscle))))) return true;
    return false;
  }

  const filteredExercises = selectedCategory
    ? allExercises.filter(ex => matchesCategory(ex, selectedCategory))
    : allExercises;

  const searchedExercises = searchTerm
    ? filteredExercises.filter(ex => {
        const term = normalize(searchTerm);
        return (
          normalize(ex.name).includes(term) ||
          (ex.description && normalize(ex.description).includes(term)) ||
          (ex.category && normalize(ex.category).includes(term)) ||
          ((ex.primaryMuscles || []).some((m: string) => normalize(m).includes(term))) ||
          ((ex.secondaryMuscles || []).some((m: string) => normalize(m).includes(term)))
        );
      })
    : filteredExercises;

  // Set editing logic
  const handleSetChange = (idx: number, field: string, value: any) => {
    setEditSets(prev => prev.map((set, i) => {
      if (i !== idx) return set;
      if (field === 'comment' || field === '_comment') {
        return { ...set, _comment: value };
      }
      if (field === 'difficulty') {
        return { ...set, difficulty: value as DifficultyCategory };
      }
      return { ...set, [field]: value };
    }));
  };
  const handleAddSet = () => setEditSets(prev => [...prev, defaultSet]);
  const handleRemoveSet = (idx: number) => setEditSets(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  // Add or update exercise log
  const handleSaveExercise = async () => {
    if (!selectedExercise || !selectedDate) return;
    // Convert sets to ExerciseSet[] with correct types
    const sets: ExerciseSet[] = editSets.map(set => ({
      reps: Number(set.reps),
      weight: Number(set.weight),
      difficulty: set.difficulty as DifficultyCategory,
      comment: set._comment || set.comment || ''
    }));
    // Ensure timestamp is always a Date (as required by ExerciseLogType)
    const log: ExerciseLogType = {
      id: editingLogId || uuidv4(),
      exerciseName: selectedExercise.name,
      sets,
      timestamp: selectedDate instanceof Date ? selectedDate : new Date(selectedDate ?? Date.now()),
      deviceId: localStorage.getItem('device_id') || undefined,
    };
    saveExerciseLog(log);
    setView('main');
    setSelectedExercise(null);
    setEditSets([defaultSet]);
    setEditingLogId(null);
    onExerciseAdded?.();
  };

  // Delete exercise log
  const handleDeleteExercise = async () => {
    if (!editingLogId || !selectedDate) return;
    // Find the full log object for this id and date
    const logs = getExerciseLogsByDate(selectedDate);
    const log = logs.find(l => l.id === editingLogId);
    if (!log) return;
    await deleteExerciseLog(log);
    setView('main');
    setSelectedExercise(null);
    setEditSets([defaultSet]);
    setEditingLogId(null);
    onExerciseAdded?.();
  };

  // Start editing an existing log
  const handleEditExisting = (log: ExerciseLogType) => {
    const foundExercise = allExercises.find(ex => ex.name === log.exerciseName);
    if (foundExercise) {
      setSelectedExercise(foundExercise);
    } else {
      setSelectedExercise({
        id: uuidv4(),
        name: log.exerciseName,
        primaryMuscles: [],
      });
    }
    setEditSets(log.sets.map(set => ({
      ...set,
      difficulty: set.difficulty || DifficultyCategory.NORMAL,
      _comment: (set as any).comment || (set as any)._comment || ''
    })));
    setEditingLogId(log.id ? String(log.id) : null);
    setView('editExercise');
  };

  const filterExercises = () => {
    let filtered = allExercises;

    if (selectedCategory) {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchLower) ||
        ex.primaryMuscles.some(m => m.toLowerCase().includes(searchLower)) ||
        (ex.equipment && ex.equipment.some(e => e.toLowerCase().includes(searchLower)))
      );
    }

    return filtered;
  };

  const renderExerciseList = () => {
    const exercises = filterExercises();
    return (
      <div className="space-y-4">
        <div className="sticky top-0 bg-gray-900 p-4 space-y-4">
          <input
            type="text"
            placeholder="Search exercises..."
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">            {CATEGORIES_META.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key === selectedCategory ? null : cat.key)}
                  className={`px-3 py-1 rounded-full ${
                    cat.key === selectedCategory ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {exercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => {
                setSelectedExercise(exercise);
                setView('editExercise');
              }}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 text-left"
            >
              <h3 className="font-bold">{exercise.name}</h3>
              <p className="text-sm text-gray-400">{exercise.primaryMuscles.join(', ')}</p>
              {exercise.equipment && (
                <p className="text-xs text-gray-500">{exercise.equipment.join(', ')}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <header className="flex-none flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
        <h1 className="text-xl font-medium text-white">Add Exercise</h1>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>
      <div className="flex-1 overflow-y-auto">
        {view === 'main' && (
          <div className="p-4 space-y-6 pb-safe">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button className="bg-purple-900 text-white rounded-lg p-6 flex flex-col items-center" onClick={() => setView('program')}>
                <span className="text-2xl mb-2">🏋️‍♂️</span>
                From program
              </button>
              <button className="bg-green-900 text-white rounded-lg p-6 flex flex-col items-center" onClick={() => setView('copy')}>
                <span className="text-2xl mb-2">📅</span>
                From another day
              </button>
              <button className="bg-blue-900 text-white rounded-lg p-6 flex flex-col items-center" onClick={() => setView('history')}>
                <span className="text-2xl mb-2">🕒</span>
                Recent exercises
              </button>
              <button className="bg-gray-800 text-gray-400 rounded-lg p-6 flex flex-col items-center" disabled>
                <span className="text-2xl mb-2">💬</span>
                Add comment
              </button>
            </div>
            <div>
              <h2 className="text-lg text-white mb-2">Browse by category</h2>
              <div className="grid grid-cols-2 gap-4">
                {CATEGORIES_META.map(cat => (
                  <button
                    key={cat.key}
                    className={`flex items-center gap-3 p-4 rounded-lg bg-[#23272F] ${cat.color} text-lg font-semibold`}
                    onClick={() => { setSelectedCategory(cat.key); setView('exerciseList'); setSearchTerm(''); }}
                  >
                    <span className="text-2xl">{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <button
                className="w-full bg-accent-primary text-white py-3 rounded-lg text-lg"
                onClick={() => setView('search')}
              >
                Search exercises
              </button>
            </div>
          </div>
        )}
        {view === 'exerciseList' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center mb-4">
              <button className="mr-4 text-gray-400" onClick={() => setView('main')}>Back</button>
              <input
                type="text"
                className="flex-1 px-4 py-2 rounded bg-[#23272F] text-white border border-white/10"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                inputMode="text"
              />
              <button className="ml-4 text-gray-400" onClick={() => setView('main')}>Cancel</button>
            </div>
            <div className="divide-y divide-white/10">
              {searchedExercises.length === 0 && <div className="text-gray-400 py-8 text-center">No exercises found</div>}
              {/* List existing logs for the day for editing/deleting */}
              {selectedDate && getExerciseLogsByDate(selectedDate).map(log => {
                // Ensure id is always a string for type safety
                // Patch: ensure id is always a string and all required fields are present for ExerciseLogType
                const safeLog: ExerciseLogType = {
                  id: log.id ? String(log.id) : uuidv4(),
                  exerciseName: log.exerciseName || '',
                  sets: Array.isArray(log.sets) ? log.sets : [],
                  timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp ?? Date.now()),
                  deviceId: log.deviceId
                };
                return (
                  <div key={safeLog.id || safeLog.exerciseName} className="flex items-center justify-between py-2 px-2 bg-[#23272F] rounded mb-2">
                    <div>
                      <div className="font-semibold text-white">{safeLog.exerciseName}</div>
                      <div className="text-gray-400 text-xs">Sets: {safeLog.sets.length}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-blue-400" onClick={() => handleEditExisting(safeLog)}>Edit</button>
                      <button className="text-red-400" onClick={async () => { setEditingLogId(safeLog.id || null); await handleDeleteExercise(); }}>Delete</button>
                    </div>
                  </div>
                );
              })}
              {/* Add new exercise from list */}
              {searchedExercises.map(ex => (
                <button
                  key={ex.name}
                  className="w-full text-left py-4 px-2 hover:bg-[#181A20] transition-colors"
                  onClick={() => { setSelectedExercise(ex); setEditSets([defaultSet]); setEditingLogId(null); setView('editExercise'); }}
                >
                  <div className="font-semibold text-white">{ex.name}</div>
                  <div className="text-gray-400 text-sm">{ex.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {view === 'editExercise' && selectedExercise && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="bg-[#181A20] rounded-xl p-6 w-full max-w-md mx-auto border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-white font-semibold">{selectedExercise.name}</h2>
                <button onClick={() => { setView('exerciseList'); setSelectedExercise(null); setEditSets([defaultSet]); setEditingLogId(null); }} className="text-gray-400">Cancel</button>
              </div>
              {editSets.map((set, idx) => (
                <div key={idx} className="mb-4 p-4 rounded-lg bg-[#23272F]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-bold">Set №{idx + 1}</span>
                  </div>
                  <div className="flex gap-2 items-center mb-2">
                    <label className="text-gray-300">KG</label>
                    <input
                      type="number"
                      className="w-20 px-2 py-1 rounded bg-black text-white border border-white/10 text-center"
                      value={set.weight}
                      onChange={e => handleSetChange(idx, 'weight', Number(e.target.value))}
                      inputMode="decimal"
                    />
                    <label className="text-gray-300 ml-4">REP</label>
                    <input
                      type="number"
                      className="w-20 px-2 py-1 rounded bg-black text-white border border-white/10 text-center"
                      value={set.reps}
                      onChange={e => handleSetChange(idx, 'reps', Number(e.target.value))}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="flex gap-2 mb-2">
                    <label className="text-gray-300">Difficulty:</label>
                    {[DifficultyCategory.WARMUP, DifficultyCategory.EASY, DifficultyCategory.NORMAL, DifficultyCategory.HARD].map(level => (
                      <button
                        key={level}
                        className={`px-2 py-1 rounded ${set.difficulty === level ? 'bg-purple-600 text-white' : 'bg-[#23272F] text-gray-400'}`}
                        onClick={() => handleSetChange(idx, 'difficulty', level)}
                        type="button"
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="w-full px-2 py-1 rounded bg-black text-white border border-white/10 mt-2"
                    placeholder="Add comment"
                    value={(set as any)._comment}
                    onChange={e => handleSetChange(idx, 'comment', e.target.value)}
                    inputMode="text"
                  />
                  <div className="flex justify-end mt-2 gap-2">
                    <button className="text-red-400" onClick={() => handleRemoveSet(idx)} disabled={editSets.length === 1}>Remove</button>
                    <button className="text-green-400" onClick={handleAddSet}>Add Set</button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between gap-4 mt-6">
                <button className="px-6 py-2 bg-gray-700 text-white rounded-lg" onClick={() => { setView('exerciseList'); setSelectedExercise(null); setEditSets([defaultSet]); setEditingLogId(null); }}>Cancel</button>
                {editingLogId && (
                  <button className="px-6 py-2 bg-red-600 text-white rounded-lg" onClick={handleDeleteExercise}>Delete</button>
                )}
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg" onClick={handleSaveExercise}>{editingLogId ? 'Save' : 'Add'}</button>
              </div>
            </div>
          </div>
        )}
        {view === 'search' && (
          <ExerciseModal onClose={() => setView('main')} onSelect={() => { setView('main'); onExerciseAdded?.(); }} />
        )}
        {view === 'history' && (
          <ExerciseHistory />
        )}
        {view === 'copy' && (
          <CopyFromPreviousSessionDialog
            isOpen={true}
            onClose={() => setView('main')}
            currentDate={selectedDate || new Date()}
            onExercisesSelected={handleExercisesCopied}
          />
        )}
        {view === 'program' && (
          <div className="p-4">
            <h2 className="text-lg text-white mb-4">Select Program</h2>
            <ul>
              {programs.map(program => (
                <li key={program.id}>
                  <button
                    className="text-left w-full py-2 px-4 bg-[#23272F] text-white rounded mb-2"
                    onClick={handleProgramExerciseAdd}
                  >
                    {program.name}
                  </button>
                </li>
              ))}
            </ul>
            <button className="mt-4 text-gray-400" onClick={() => setView('main')}>Back</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogOptions;