import React, { useState, useEffect } from 'react';
import { Exercise, ExerciseFilter, MuscleGroup } from '@/types/exercise';
// import { searchExercises } from '@/services/firebase/exercises'; // Firebase removed

type ExerciseType = Exercise['type'];
type ExerciseCategory = Exercise['category'];

export interface ExerciseModalProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({ onSelect, onClose }) => {
  const [searchText, setSearchText] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ExerciseFilter>({
    type: [],
    category: [],
    muscles: [],
    equipment: []
  });

  // Load initial exercises
  useEffect(() => {
    loadExercises();
  }, []);

  // Load exercises with current filters (local only)
  const loadExercises = async () => {
    try {
      setLoading(true);
      // Load from local static file or in-memory DB
      // For now, try to import from '@/data/exercises' or '@/data/exerciseDatabase'

      let allExercises: Exercise[] = [];
      try {
        // Use allExercises from exercises.ts (local static array)
        const imported = (await import('@/data/exercises')).allExercises;
        // Convert imported exercises to proper Exercise type
        allExercises = imported.map((ex, idx) => ({
          id: `${ex.name.replace(/\s+/g, '_').toLowerCase()}_${idx}`,
          name: ex.name,
          description: ex.description,
          type: ex.type,
          category: ex.category,
          primaryMuscles: ex.primaryMuscles,
          secondaryMuscles: ex.secondaryMuscles || [],
          equipment: ex.equipment || [],
          instructions: ex.instructions || [],
          tips: ex.tips || [],
          videoUrl: ex.videoUrl || '',
          imageUrl: ex.imageUrl || '',
          defaultUnit: ex.defaultUnit || 'kg',
          metrics: ex.metrics || {
            trackWeight: true,
            trackReps: true,
            trackTime: false,
            trackDistance: false,
            trackRPE: false
          }
        }));
      } catch {
        allExercises = [];
      }

      // Filter by searchText and filters
      let filtered = allExercises;
      if (searchText) {
        const lower = searchText.toLowerCase();
        filtered = filtered.filter(ex =>
          ex.name.toLowerCase().includes(lower) ||
          (ex.description && ex.description.toLowerCase().includes(lower))
        );
      }
      if (filters.type && filters.type.length > 0) {
        filtered = filtered.filter(ex => filters.type?.includes(ex.type));
      }
      if (filters.category && filters.category.length > 0) {
        filtered = filtered.filter(ex => filters.category?.includes(ex.category));
      }
      if (filters.muscles && filters.muscles.length > 0) {
        filtered = filtered.filter(ex =>
          (ex.primaryMuscles && ex.primaryMuscles.some(m => filters.muscles?.includes(m))) ||
          (ex.secondaryMuscles && ex.secondaryMuscles.some(m => filters.muscles?.includes(m)))
        );
      }
      if (filters.equipment && filters.equipment.length > 0) {
        filtered = filtered.filter(ex =>
          Array.isArray(ex.equipment)
            ? ex.equipment.some(eq => filters.equipment?.includes(eq))
            : (ex.equipment && filters.equipment?.includes(ex.equipment))
        );
      }
      setExercises(filtered);
    } catch (error) {
      console.error('Error loading exercises:', error);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  // Update type filter
  const updateTypeFilter = (type: ExerciseType) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type?.includes(type) 
        ? prev.type.filter(t => t !== type)
        : [...(prev.type || []), type]
    }));
  };

  // Update category filter
  const updateCategoryFilter = (category: ExerciseCategory) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category?.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...(prev.category || []), category]
    }));
  };

  // Update muscle filter
  const updateMuscleFilter = (muscle: MuscleGroup) => {
    setFilters(prev => ({
      ...prev,
      muscles: prev.muscles?.includes(muscle)
        ? prev.muscles.filter(m => m !== muscle)
        : [...(prev.muscles || []), muscle]
    }));
  };

  // Update equipment filter
  const updateEquipmentFilter = (equipment: string) => {
    setFilters(prev => ({
      ...prev,
      equipment: prev.equipment?.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...(prev.equipment || []), equipment]
    }));
  };

  // Search when text or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadExercises();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, filters]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-bg-primary rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Select Exercise</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-4">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-bg-secondary text-text-primary border border-border focus:border-accent-primary focus:outline-none"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Exercise Type Filter */}
            <div>
              <h3 className="font-semibold mb-2 text-text-primary">Type</h3>
              <div className="space-y-1">
                {(['strength', 'cardio', 'flexibility', 'bodyweight'] as ExerciseType[]).map(type => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.type?.includes(type)}
                      onChange={() => updateTypeFilter(type)}
                      className="accent-accent-primary"
                    />
                    <span className="text-text-secondary capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="font-semibold mb-2 text-text-primary">Category</h3>
              <div className="space-y-1">
                {(['compound', 'isolation', 'olympic', 'cardio', 'stretching', 'power'] as ExerciseCategory[]).map(category => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.category?.includes(category)}
                      onChange={() => updateCategoryFilter(category)}
                      className="accent-accent-primary"
                    />
                    <span className="text-text-secondary capitalize">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Muscle Group Filter */}
            <div>
              <h3 className="font-semibold mb-2 text-text-primary">Muscle Group</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {([
                  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
                  'quadriceps', 'hamstrings', 'calves', 'glutes', 'core', 'traps',
                  'lats', 'lower_back', 'full_body'
                ] as MuscleGroup[]).map(muscle => (
                  <label key={muscle} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.muscles?.includes(muscle)}
                      onChange={() => updateMuscleFilter(muscle)}
                      className="accent-accent-primary"
                    />
                    <span className="text-text-secondary capitalize">{muscle.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Equipment Filter */}
            <div>
              <h3 className="font-semibold mb-2 text-text-primary">Equipment</h3>
              <div className="space-y-1">
                {['barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'bodyweight', 'bands'].map(equipment => (
                  <label key={equipment} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.equipment?.includes(equipment)}
                      onChange={() => updateEquipmentFilter(equipment)}
                      className="accent-accent-primary"
                    />
                    <span className="text-text-secondary capitalize">{equipment}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto border border-border rounded-md">
          {loading ? (
            <div className="p-4 text-center text-text-secondary">Loading exercises...</div>
          ) : exercises.length === 0 ? (
            <div className="p-4 text-center text-text-secondary">No exercises found</div>
          ) : (
            <div className="divide-y divide-border">
              {exercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => onSelect(exercise)}
                  className="w-full p-4 text-left hover:bg-bg-secondary transition-colors duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-text-primary">{exercise.name}</h3>
                      <p className="text-sm text-text-secondary mt-1">{exercise.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-accent-primary/10 text-accent-primary">
                          {exercise.type}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary">
                          {exercise.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(exercise);
                      }}
                      className="px-4 py-2 bg-accent-primary hover:bg-accent-secondary text-text-primary rounded-md transition-colors duration-200"
                    >
                      Add
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseModal;
