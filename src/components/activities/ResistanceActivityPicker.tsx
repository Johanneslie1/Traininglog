import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ActivityType, ResistanceExercise } from '@/types/activityTypes';
import { activityService, activityLoggingService } from '@/services/activityService';

interface ResistanceActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
}

interface SetData {
  weight: number;
  reps: number;
  rpe?: number;
  restTime?: number;
  notes?: string;
}

const ResistanceActivityPicker: React.FC<ResistanceActivityPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date()
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [exercises, setExercises] = useState<ResistanceExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ResistanceExercise | null>(null);
  const [sets, setSets] = useState<SetData[]>([]);
  const [currentSet, setCurrentSet] = useState<SetData>({
    weight: 0,
    reps: 0,
    rpe: undefined,
    restTime: undefined,
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [view, setView] = useState<'list' | 'logging'>('list');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadResistanceExercises();
  }, []);

  const loadResistanceExercises = () => {
    const resistanceExercises = activityService.getActivitiesByType(ActivityType.RESISTANCE);
    setExercises(resistanceExercises.map((ex, index) => ({
      ...ex,
      id: `resistance-${index}`
    })) as ResistanceExercise[]);
  };

  const categories = [
    { id: '', name: 'All Categories', icon: '📋' },
    { id: 'compound', name: 'Compound', icon: '🏋️‍♂️' },
    { id: 'isolation', name: 'Isolation', icon: '🎯' },
    { id: 'olympic', name: 'Olympic', icon: '🥇' },
    { id: 'powerlifting', name: 'Powerlifting', icon: '💪' }
  ];

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.primaryMuscles.some(muscle => 
                           muscle.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesCategory = selectedCategory === '' || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExerciseSelect = (exercise: ResistanceExercise) => {
    setSelectedExercise(exercise);
    setView('logging');
  };

  const handleAddSet = () => {
    if (currentSet.weight > 0 && currentSet.reps > 0) {
      setSets(prev => [...prev, { ...currentSet }]);
      setCurrentSet({
        weight: currentSet.weight, // Keep weight for next set
        reps: currentSet.reps, // Keep reps for next set
        rpe: undefined,
        restTime: undefined,
        notes: ''
      });
    }
  };

  const handleRemoveSet = (index: number) => {
    setSets(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveExercise = async () => {
    if (!selectedExercise || !user?.id || sets.length === 0) return;

    setLoading(true);
    try {
      await activityLoggingService.logResistanceExercise(
        selectedExercise.id,
        selectedExercise.name,
        sets,
        user.id,
        selectedDate
      );
      onActivityLogged();
    } catch (error) {
      console.error('Error saving resistance exercise:', error);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'logging' && selectedExercise) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1a1a1a] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedExercise.name}</h2>
                <p className="text-gray-400 text-sm mt-1">{selectedExercise.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('list')}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Change Exercise
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Current Set Input */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Add Set #{sets.length + 1}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Weight ({selectedExercise.defaultUnit})
                  </label>
                  <input
                    type="number"
                    value={currentSet.weight}
                    onChange={(e) => setCurrentSet(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Reps</label>
                  <input
                    type="number"
                    value={currentSet.reps}
                    onChange={(e) => setCurrentSet(prev => ({ ...prev, reps: Number(e.target.value) }))}
                    className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">RPE (1-10)</label>
                  <input
                    type="number"
                    value={currentSet.rpe || ''}
                    onChange={(e) => setCurrentSet(prev => ({ ...prev, rpe: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    min="1"
                    max="10"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rest Time (sec)</label>
                  <input
                    type="number"
                    value={currentSet.restTime || ''}
                    onChange={(e) => setCurrentSet(prev => ({ ...prev, restTime: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    min="0"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <input
                  type="text"
                  value={currentSet.notes}
                  onChange={(e) => setCurrentSet(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Optional notes for this set"
                />
              </div>
              <button
                onClick={handleAddSet}
                disabled={currentSet.weight <= 0 || currentSet.reps <= 0}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Add Set
              </button>
            </div>

            {/* Sets List */}
            {sets.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">Completed Sets</h3>
                <div className="space-y-2">
                  {sets.map((set, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
                      <div className="flex items-center space-x-4 text-white">
                        <span className="font-medium">Set {index + 1}:</span>
                        <span>{set.weight}{selectedExercise.defaultUnit} × {set.reps}</span>
                        {set.rpe && <span className="text-blue-400">RPE {set.rpe}</span>}
                        {set.notes && <span className="text-gray-400 text-sm">"{set.notes}"</span>}
                      </div>
                      <button
                        onClick={() => handleRemoveSet(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Back to Activities
              </button>
              <button
                onClick={handleSaveExercise}
                disabled={sets.length === 0 || loading}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Saving...' : `Save Exercise (${sets.length} sets)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Resistance Training</h2>
              <p className="text-gray-400">Choose an exercise to log your workout</p>
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

          {/* Search and Categories */}
          <div className="mt-4 space-y-4">
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
                  }`}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleExerciseSelect(exercise)}
                className="p-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-left transition-colors border border-white/10 hover:border-white/20"
              >
                <h3 className="text-white font-medium mb-2">{exercise.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{exercise.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {exercise.primaryMuscles.slice(0, 3).map((muscle, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded">
                      {muscle}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  {exercise.category} • {exercise.equipment.join(', ')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            ← Back to Activity Types
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResistanceActivityPicker;
