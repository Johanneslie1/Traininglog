import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Exercise, MuscleGroup } from '@/types/exercise';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { useAuth } from '@/hooks/useAuth';

interface CreateExerciseDialogProps {
  onClose: () => void;
  onSuccess?: (exerciseId: string) => void;
}

export const bodyParts = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Core',
  'Full Body',
  'Cardio',
] as const;

export const exerciseTypes = [
  'Strength',
  'Hypertrophy',
  'Endurance',
  'Power',
  'Cardio',
  'Flexibility',
  'Balance',
] as const;

export const trainingCategories = [
  'Beginner',
  'Intermediate',
  'Advanced',
] as const;

type BodyPart = typeof bodyParts[number];
type ExerciseTypeEnum = typeof exerciseTypes[number];
type TrainingCategory = typeof trainingCategories[number];

interface ExerciseFormData {
  name: string;
  bodyParts: BodyPart[];
  type: ExerciseTypeEnum;
  trainingCategory: TrainingCategory;
  description: string;
}

interface FormErrors {
  name?: string;
  bodyParts?: string;
  description?: string;
}

export const CreateExerciseDialog: React.FC<CreateExerciseDialogProps> = ({
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercise, setExercise] = useState<ExerciseFormData>({
    name: '',
    bodyParts: [],
    type: 'Strength',
    trainingCategory: 'Beginner',
    description: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!exercise.name?.trim()) {
      newErrors.name = 'Exercise name is required';
    } else if (exercise.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!exercise.bodyParts?.length) {
      newErrors.bodyParts = 'Select at least one body part';
    }

    if (!exercise.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (exercise.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        type: exercise.type === 'Cardio' ? 'cardio' : 
              exercise.type === 'Flexibility' ? 'flexibility' : 'strength',
        category: exercise.type === 'Cardio' ? 'cardio' : 
                 exercise.type === 'Flexibility' ? 'stretching' : 
                 exercise.bodyParts.length > 1 ? 'compound' : 'isolation',
        primaryMuscles: exercise.bodyParts.map(p => p.toLowerCase().replace(/\s+/g, '_') as MuscleGroup),
        secondaryMuscles: [],
        instructions: [exercise.description],
        defaultUnit: exercise.type === 'Cardio' ? 'time' : 'kg',
        metrics: {
          trackWeight: exercise.type !== 'Cardio',
          trackReps: exercise.type !== 'Cardio',
          trackTime: exercise.type === 'Cardio',
          trackDistance: false,
          trackRPE: true,
        },
        customExercise: true,
        userId: user.id
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

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ExerciseTypeEnum;
    setExercise(prev => ({ ...prev, type: value }));
  };

  const handleCategoryChange = (category: TrainingCategory) => {
    setExercise(prev => ({ ...prev, trainingCategory: category }));
  };

  const handleBodyPartToggle = (part: BodyPart) => {
    setExercise(prev => ({
      ...prev,
      bodyParts: prev.bodyParts.includes(part)
        ? prev.bodyParts.filter(p => p !== part)
        : [...prev.bodyParts, part]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-[#1a1a1a] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/90">
                Exercise Name
              </label>
              <input
                type="text"
                id="name"
                required
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder-white/40"
                value={exercise.name}
                onChange={(e) => setExercise(prev => ({ ...prev, name: e.target.value }))}
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90">Body Parts</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {bodyParts.map((part) => (
                  <button
                    key={part}
                    type="button"
                    className={`rounded-full px-3 py-1 text-sm ${
                      exercise.bodyParts.includes(part)
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#2a2a2a] text-white/70 hover:bg-[#3a3a3a]'
                    }`}
                    onClick={() => handleBodyPartToggle(part)}
                  >
                    {part}
                  </button>
                ))}
              </div>
              {errors.bodyParts && <p className="mt-1 text-sm text-red-400">{errors.bodyParts}</p>}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-white/90">
                Exercise Type
              </label>
              <select
                id="type"
                required
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={exercise.type}
                onChange={handleTypeChange}
              >
                {exerciseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-white/90">
                Training Category
              </label>
              <select
                id="category"
                required
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={exercise.trainingCategory}
                onChange={(e) => handleCategoryChange(e.target.value as TrainingCategory)}
              >
                {trainingCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white/90">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder-white/40"
                value={exercise.description}
                onChange={(e) => setExercise(prev => ({ ...prev, description: e.target.value }))}
              />
              {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50"
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

export default CreateExerciseDialog;
