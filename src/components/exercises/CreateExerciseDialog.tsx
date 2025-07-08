import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ExerciseType } from '@/types/exercise';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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

export const CreateExerciseDialog: React.FC<CreateExerciseDialogProps> = ({
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercise, setExercise] = useState<Partial<ExerciseType>>({
    name: '',
    bodyParts: [],
    type: 'Strength',
    trainingCategory: 'Beginner',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const exerciseData = {
        ...exercise,
        createdBy: user?.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isCustom: true,
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

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Create New Exercise</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Exercise Name */}
          <div className="space-y-2">
            <label className="text-lg text-white/90">
              Exercise Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => setExercise(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Single-Arm Dumbbell Row"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Body Parts */}
          <div className="space-y-2">
            <label className="text-lg text-white/90">
              Target Body Parts <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {bodyParts.map((part) => (
                <button
                  key={part}
                  type="button"
                  onClick={() => {
                    setExercise(prev => ({
                      ...prev,
                      bodyParts: prev.bodyParts?.includes(part)
                        ? prev.bodyParts.filter(p => p !== part)
                        : [...(prev.bodyParts || []), part]
                    }));
                  }}
                  className={`px-4 py-3 rounded-lg ${
                    exercise.bodyParts?.includes(part)
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#2a2a2a] text-white/70'
                  } text-sm font-medium transition-colors min-h-[44px]`}
                >
                  {part}
                </button>
              ))}
            </div>
            {errors.bodyParts && (
              <p className="text-sm text-red-500">{errors.bodyParts}</p>
            )}
          </div>

          {/* Exercise Type */}
          <div className="space-y-2">
            <label className="text-lg text-white/90">Exercise Type</label>
            <select
              value={exercise.type}
              onChange={(e) => setExercise(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {exerciseTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Training Category */}
          <div className="space-y-2">
            <label className="text-lg text-white/90">Training Category</label>
            <div className="grid grid-cols-3 gap-2">
              {trainingCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setExercise(prev => ({ ...prev, trainingCategory: category }))}
                  className={`px-4 py-3 rounded-lg ${
                    exercise.trainingCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#2a2a2a] text-white/70'
                  } text-sm font-medium transition-colors min-h-[44px]`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-lg text-white/90">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={exercise.description}
              onChange={(e) => setExercise(prev => ({ ...prev, description: e.target.value }))}
              className="w-full h-32 px-4 py-3 rounded-lg bg-[#2a2a2a] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Describe the exercise, including proper form and technique..."
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>
        </form>

        <footer className="px-6 py-4 border-t border-white/10">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-white/10 text-white font-medium min-h-[44px]"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-8 py-3 rounded-lg bg-purple-600 text-white font-medium min-h-[44px] relative"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="opacity-0">Save</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CreateExerciseDialog;
