import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Exercise, MuscleGroup } from '@/types/exercise';
import { ActivityType } from '@/types/activityTypes';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { useAuth } from '@/hooks/useAuth';

interface CreateUniversalExerciseDialogProps {
  onClose: () => void;
  onSuccess?: (exerciseId: string) => void;
  activityType?: ActivityType;
  searchQuery?: string;
}

// General body parts/target areas
export const generalTargetAreas = [
  'Chest',
  'Back', 
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Core',
  'Legs',
  'Quadriceps',
  'Hamstrings',
  'Calves',
  'Glutes',
  'Full Body',
  'Upper Body',
  'Lower Body',
  'Cardiovascular',
] as const;

// Sport types
export const sportTypes = [
  'Football',
  'Basketball',
  'Tennis',
  'Soccer',
  'Baseball',
  'Swimming',
  'Running',
  'Cycling',
  'Boxing',
  'Wrestling',
  'Track & Field',
  'Hockey',
  'Volleyball',
  'Golf',
  'Other',
] as const;

// Endurance categories
export const enduranceCategories = [
  'Running',
  'Cycling',
  'Swimming',
  'Rowing',
  'Walking',
  'Hiking',
  'HIIT',
  'Circuit Training',
  'Other Cardio',
] as const;

// Speed & Agility drill types
export const drillTypes = [
  'Speed',
  'Agility',
  'Plyometric', 
  'Reaction',
  'Coordination',
  'Balance',
  'Power',
  'Change of Direction',
] as const;

// Flexibility/Stretching types
export const flexibilityTypes = [
  'Static Stretching',
  'Dynamic Stretching',
  'Yoga',
  'Pilates',
  'Mobility Work',
  'Foam Rolling',
  'PNF Stretching',
  'Active Recovery',
] as const;

// Equipment options
export const equipmentOptions = [
  'None (Bodyweight)',
  'Dumbbells',
  'Barbell',
  'Kettlebell',
  'Resistance Bands',
  'Medicine Ball',
  'Pull-up Bar',
  'Bench',
  'Cable Machine',
  'Treadmill',
  'Stationary Bike',
  'Rowing Machine',
  'Pool',
  'Track',
  'Field',
  'Court',
  'Mats',
  'Cones',
  'Ladder',
  'Other',
] as const;

type GeneralTargetArea = typeof generalTargetAreas[number];
type SportType = typeof sportTypes[number];
type EnduranceCategory = typeof enduranceCategories[number];
type DrillType = typeof drillTypes[number];
type FlexibilityType = typeof flexibilityTypes[number];
type Equipment = typeof equipmentOptions[number];

interface UniversalExerciseFormData {
  name: string;
  description: string;
  targetAreas: GeneralTargetArea[];
  equipment: Equipment[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  
  // Activity-specific fields
  sportType?: SportType;
  enduranceCategory?: EnduranceCategory;
  drillType?: DrillType;
  flexibilityType?: FlexibilityType;
  
  // Instructions/tips
  instructions: string;
  tips: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  targetAreas?: string;
  instructions?: string;
}

export const CreateUniversalExerciseDialog: React.FC<CreateUniversalExerciseDialogProps> = ({
  onClose,
  onSuccess,
  activityType = ActivityType.RESISTANCE,
  searchQuery = ''
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercise, setExercise] = useState<UniversalExerciseFormData>({
    name: searchQuery,
    description: '',
    targetAreas: [],
    equipment: [],
    difficulty: 'Beginner',
    instructions: '',
    tips: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!exercise.name?.trim()) {
      newErrors.name = 'Exercise name is required';
    } else if (exercise.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!exercise.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (exercise.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!exercise.targetAreas?.length) {
      newErrors.targetAreas = 'Select at least one target area';
    }

    if (!exercise.instructions?.trim()) {
      newErrors.instructions = 'Instructions are required';
    } else if (exercise.instructions.length < 10) {
      newErrors.instructions = 'Instructions must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mapTargetAreasToMuscleGroups = (areas: GeneralTargetArea[]): MuscleGroup[] => {
    const mapping: Record<string, MuscleGroup> = {
      'Chest': 'chest',
      'Back': 'back',
      'Shoulders': 'shoulders',
      'Biceps': 'biceps',
      'Triceps': 'triceps',
      'Forearms': 'forearms',
      'Core': 'core',
      'Legs': 'quadriceps',
      'Quadriceps': 'quadriceps',
      'Hamstrings': 'hamstrings',
      'Calves': 'calves',
      'Glutes': 'glutes',
      'Full Body': 'full_body',
      'Upper Body': 'full_body',
      'Lower Body': 'quadriceps',
      'Cardiovascular': 'full_body',
    };

    return areas.map(area => mapping[area] || 'full_body' as MuscleGroup);
  };

  const getExerciseType = (): Exercise['type'] => {
    switch (activityType) {
      case ActivityType.RESISTANCE:
        return 'strength';
      case ActivityType.ENDURANCE:
        return 'cardio';
      case ActivityType.STRETCHING:
        return 'flexibility';
      case ActivityType.SPORT:
      case ActivityType.SPEED_AGILITY:
      case ActivityType.OTHER:
      default:
        return 'strength';
    }
  };

  const getExerciseCategory = (): Exercise['category'] => {
    switch (activityType) {
      case ActivityType.RESISTANCE:
        return exercise.targetAreas.length > 1 ? 'compound' : 'isolation';
      case ActivityType.ENDURANCE:
        return 'cardio';
      case ActivityType.STRETCHING:
        return 'stretching';
      case ActivityType.SPORT:
        return 'sport';
      case ActivityType.SPEED_AGILITY:
        return 'plyometric';
      case ActivityType.OTHER:
      default:
        return 'other';
    }
  };

  const getDefaultUnit = (): Exercise['defaultUnit'] => {
    switch (activityType) {
      case ActivityType.RESISTANCE:
        return 'kg';
      case ActivityType.ENDURANCE:
      case ActivityType.STRETCHING:
      case ActivityType.SPORT:
      case ActivityType.SPEED_AGILITY:
      case ActivityType.OTHER:
      default:
        return 'time';
    }
  };

  const getMetrics = (): Exercise['metrics'] => {
    switch (activityType) {
      case ActivityType.RESISTANCE:
        return {
          trackWeight: true,
          trackReps: true,
          trackSets: true,
          trackTime: false,
          trackDistance: false,
          trackRPE: true,
        };
      case ActivityType.ENDURANCE:
        return {
          trackWeight: false,
          trackReps: true, // All exercises support sets/reps
          trackSets: true,
          trackTime: true,
          trackDistance: true,
          trackRPE: true,
          trackIntensity: true,
        };
      case ActivityType.STRETCHING:
        return {
          trackWeight: false,
          trackReps: true, // All exercises support sets/reps
          trackSets: true,
          trackTime: true,
          trackDistance: false,
          trackRPE: true,
        };
      case ActivityType.SPORT:
        return {
          trackWeight: false,
          trackReps: true,
          trackSets: true,
          trackTime: true,
          trackDistance: true,
          trackRPE: true,
        };
      case ActivityType.SPEED_AGILITY:
        return {
          trackWeight: false,
          trackReps: true,
          trackSets: true,
          trackTime: true,
          trackDistance: true,
          trackRPE: true,
          trackHeight: true,
        };
      case ActivityType.OTHER:
      default:
        return {
          trackWeight: false,
          trackReps: true, // All exercises support sets/reps
          trackSets: true,
          trackTime: true,
          trackDistance: false,
          trackRPE: true,
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create exercises');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const exerciseData: Omit<Exercise, 'id'> = {
        name: exercise.name.trim(),
        description: exercise.description.trim(),
        type: getExerciseType(),
        category: getExerciseCategory(),
        activityType: activityType,
        primaryMuscles: mapTargetAreasToMuscleGroups(exercise.targetAreas),
        secondaryMuscles: [],
        instructions: exercise.instructions.trim() ? [exercise.instructions.trim()] : [],
        tips: exercise.tips.trim() ? [exercise.tips.trim()] : [],
        equipment: exercise.equipment.map(eq => eq.replace(' (Bodyweight)', '')),
        difficulty: exercise.difficulty.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
        defaultUnit: getDefaultUnit(),
        metrics: getMetrics(),
        customExercise: true,
        isDefault: false,
        createdBy: user.id,
        userId: user.id,
        
        // Activity-specific fields
        ...(activityType === ActivityType.SPORT && exercise.sportType && {
          sportType: exercise.sportType,
          teamBased: ['Football', 'Basketball', 'Soccer', 'Hockey', 'Volleyball'].includes(exercise.sportType)
        }),
        ...(activityType === ActivityType.ENDURANCE && exercise.enduranceCategory && {
          category: exercise.enduranceCategory.toLowerCase().replace(/\s+/g, '_')
        }),
        ...(activityType === ActivityType.SPEED_AGILITY && exercise.drillType && {
          drillType: exercise.drillType
        }),
        ...(activityType === ActivityType.STRETCHING && exercise.flexibilityType && {
          flexibilityType: exercise.flexibilityType
        }),
      };

      const docRef = await addDoc(collection(db, 'exercises'), exerciseData);
      toast.success('Exercise created successfully!');
      onSuccess?.(docRef.id);
      onClose();
    } catch (error) {
      console.error('Error creating exercise:', error);
      toast.error('Failed to create exercise. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTargetAreaToggle = (area: GeneralTargetArea) => {
    setExercise(prev => ({
      ...prev,
      targetAreas: prev.targetAreas.includes(area)
        ? prev.targetAreas.filter(a => a !== area)
        : [...prev.targetAreas, area]
    }));
  };

  const handleEquipmentToggle = (equipment: Equipment) => {
    setExercise(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  const getActivityTypeTitle = () => {
    switch (activityType) {
      case ActivityType.RESISTANCE:
        return 'Resistance Exercise';
      case ActivityType.ENDURANCE:
        return 'Endurance Activity';
      case ActivityType.SPORT:
        return 'Sport Activity';
      case ActivityType.STRETCHING:
        return 'Stretching/Flexibility';
      case ActivityType.SPEED_AGILITY:
        return 'Speed & Agility Drill';
      case ActivityType.OTHER:
        return 'Custom Activity';
      default:
        return 'New Exercise';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-[#1a1a1a] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">Create {getActivityTypeTitle()}</h3>
              <p className="text-sm text-gray-400 mt-1">
                Add a custom exercise to your database
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/90">
                Exercise Name *
              </label>
              <input
                type="text"
                id="name"
                required
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder-white/40 px-3 py-2"
                value={exercise.name}
                onChange={(e) => setExercise(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Bench Press, Morning Run, Basketball Shooting"
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white/90">
                Description *
              </label>
              <textarea
                id="description"
                rows={3}
                required
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder-white/40 px-3 py-2"
                value={exercise.description}
                onChange={(e) => setExercise(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the exercise or activity..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90">Target Areas *</label>
              <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {generalTargetAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      exercise.targetAreas.includes(area)
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#2a2a2a] text-white/70 hover:bg-[#3a3a3a]'
                    }`}
                    onClick={() => handleTargetAreaToggle(area)}
                  >
                    {area}
                  </button>
                ))}
              </div>
              {errors.targetAreas && <p className="mt-1 text-sm text-red-400">{errors.targetAreas}</p>}
            </div>

            {/* Activity-specific fields */}
            {activityType === ActivityType.SPORT && (
              <div>
                <label htmlFor="sportType" className="block text-sm font-medium text-white/90">
                  Sport Type
                </label>
                <select
                  id="sportType"
                  className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  value={exercise.sportType || ''}
                  onChange={(e) => setExercise(prev => ({ ...prev, sportType: e.target.value as SportType }))}
                >
                  <option value="">Select sport type...</option>
                  {sportTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}

            {activityType === ActivityType.ENDURANCE && (
              <div>
                <label htmlFor="enduranceCategory" className="block text-sm font-medium text-white/90">
                  Endurance Category
                </label>
                <select
                  id="enduranceCategory"
                  className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  value={exercise.enduranceCategory || ''}
                  onChange={(e) => setExercise(prev => ({ ...prev, enduranceCategory: e.target.value as EnduranceCategory }))}
                >
                  <option value="">Select category...</option>
                  {enduranceCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}

            {activityType === ActivityType.SPEED_AGILITY && (
              <div>
                <label htmlFor="drillType" className="block text-sm font-medium text-white/90">
                  Drill Type
                </label>
                <select
                  id="drillType"
                  className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  value={exercise.drillType || ''}
                  onChange={(e) => setExercise(prev => ({ ...prev, drillType: e.target.value as DrillType }))}
                >
                  <option value="">Select drill type...</option>
                  {drillTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}

            {activityType === ActivityType.STRETCHING && (
              <div>
                <label htmlFor="flexibilityType" className="block text-sm font-medium text-white/90">
                  Flexibility Type
                </label>
                <select
                  id="flexibilityType"
                  className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  value={exercise.flexibilityType || ''}
                  onChange={(e) => setExercise(prev => ({ ...prev, flexibilityType: e.target.value as FlexibilityType }))}
                >
                  <option value="">Select flexibility type...</option>
                  {flexibilityTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/90">Equipment</label>
              <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {equipmentOptions.map((equipment) => (
                  <button
                    key={equipment}
                    type="button"
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      exercise.equipment.includes(equipment)
                        ? 'bg-green-600 text-white'
                        : 'bg-[#2a2a2a] text-white/70 hover:bg-[#3a3a3a]'
                    }`}
                    onClick={() => handleEquipmentToggle(equipment)}
                  >
                    {equipment}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-white/90">
                Difficulty Level
              </label>
              <select
                id="difficulty"
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                value={exercise.difficulty}
                onChange={(e) => setExercise(prev => ({ ...prev, difficulty: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' }))}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-white/90">
                Instructions *
              </label>
              <textarea
                id="instructions"
                rows={4}
                required
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder-white/40 px-3 py-2"
                value={exercise.instructions}
                onChange={(e) => setExercise(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Step-by-step instructions for performing this exercise..."
              />
              {errors.instructions && <p className="mt-1 text-sm text-red-400">{errors.instructions}</p>}
            </div>

            <div>
              <label htmlFor="tips" className="block text-sm font-medium text-white/90">
                Tips & Notes
              </label>
              <textarea
                id="tips"
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder-white/40 px-3 py-2"
                value={exercise.tips}
                onChange={(e) => setExercise(prev => ({ ...prev, tips: e.target.value }))}
                placeholder="Optional tips, variations, or safety notes..."
              />
            </div>

            <div className="mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Exercise'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUniversalExerciseDialog;
