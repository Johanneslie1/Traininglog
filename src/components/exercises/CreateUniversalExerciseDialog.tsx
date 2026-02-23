import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { collection, orderBy, query, QueryConstraint, where } from 'firebase/firestore';
import { ActivityType } from '@/types/activityTypes';
import type { Exercise } from '@/types/exercise';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useCollection';
import { db } from '@/services/firebase/config';
import {
  createExerciseByActivityType,
  deleteCustomExerciseById,
  DuplicateExerciseNameError,
  findDuplicateExerciseByName,
  updateExerciseByActivityType
} from '@/services/customExerciseCreationService';

interface CreateUniversalExerciseDialogProps {
  onClose: () => void;
  onSuccess?: (exerciseId: string) => void;
  activityType?: ActivityType;
  searchQuery?: string;
  initialExercise?: Exercise;
}

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
  'Cardiovascular'
] as const;

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
  'Other'
] as const;

export const enduranceCategories = [
  'Running',
  'Cycling',
  'Swimming',
  'Rowing',
  'Walking',
  'Hiking',
  'HIIT',
  'Circuit Training',
  'Other Cardio'
] as const;

export const drillTypes = [
  'Speed',
  'Agility',
  'Plyometric',
  'Reaction',
  'Coordination',
  'Balance',
  'Power',
  'Change of Direction'
] as const;

export const flexibilityTypes = [
  'Static Stretching',
  'Dynamic Stretching',
  'Yoga',
  'Pilates',
  'Mobility Work',
  'Foam Rolling',
  'PNF Stretching',
  'Active Recovery'
] as const;

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
  'Other'
] as const;

type GeneralTargetArea = typeof generalTargetAreas[number];
type SportType = typeof sportTypes[number];
type EnduranceCategory = typeof enduranceCategories[number];
type DrillType = typeof drillTypes[number];
type FlexibilityType = typeof flexibilityTypes[number];
type Equipment = typeof equipmentOptions[number];

type FormStep = 1 | 2 | 3;

interface UniversalExerciseFormData {
  name: string;
  description: string;
  targetAreas: GeneralTargetArea[];
  equipment: Equipment[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  sportType?: SportType;
  enduranceCategory?: EnduranceCategory;
  drillType?: DrillType;
  flexibilityType?: FlexibilityType;
  instructions: string;
  tips: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  targetAreas?: string;
  instructions?: string;
}

const getFormFromExercise = (exercise?: Exercise, fallbackName = ''): UniversalExerciseFormData => {
  if (!exercise) {
    return {
      name: fallbackName,
      description: '',
      targetAreas: [],
      equipment: [],
      difficulty: 'Beginner',
      instructions: '',
      tips: ''
    };
  }

  const difficultyValue = exercise.difficulty
    ? `${exercise.difficulty.charAt(0).toUpperCase()}${exercise.difficulty.slice(1)}`
    : 'Beginner';

  return {
    name: exercise.name ?? fallbackName,
    description: exercise.description ?? '',
    targetAreas: (exercise.targetAreas ?? []) as GeneralTargetArea[],
    equipment: (exercise.equipment ?? []) as Equipment[],
    difficulty: (difficultyValue as UniversalExerciseFormData['difficulty']) ?? 'Beginner',
    instructions: Array.isArray(exercise.instructions) ? exercise.instructions.join('\n') : '',
    tips: Array.isArray(exercise.tips) ? exercise.tips.join('\n') : '',
    sportType: exercise.sportType as SportType | undefined,
    enduranceCategory: (exercise.category as EnduranceCategory) ?? undefined,
    drillType: exercise.drillType as DrillType | undefined,
    flexibilityType: (exercise.category as FlexibilityType) ?? undefined
  };
};

const normalizeExerciseName = (name: string): string => name.trim().replace(/\s+/g, ' ').toLowerCase();

export const CreateUniversalExerciseDialog: React.FC<CreateUniversalExerciseDialogProps> = ({
  onClose,
  onSuccess,
  activityType,
  searchQuery = '',
  initialExercise
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType | null>(
    activityType ?? initialExercise?.activityType ?? null
  );
  const [exercise, setExercise] = useState<UniversalExerciseFormData>(
    getFormFromExercise(initialExercise, searchQuery)
  );
  const [step, setStep] = useState<FormStep>(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [duplicateExercise, setDuplicateExercise] = useState<Exercise | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Exercise | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(initialExercise?.id ?? null);

  const isEditMode = Boolean(editingExerciseId);
  const allowActivityTypeSelection = !activityType;

  const customExerciseConstraints: QueryConstraint[] = [];
  if (user?.id) {
    customExerciseConstraints.push(where('userId', '==', user.id));
  } else {
    customExerciseConstraints.push(where('userId', '==', '__no-user__'));
  }
  customExerciseConstraints.push(orderBy('name'));

  const customExerciseQuery = query(collection(db, 'exercises'), ...customExerciseConstraints);
  const { documents: userExercises } = useCollection<Exercise>(customExerciseQuery);
  const customExercises = useMemo(() => {
    return (userExercises ?? []).filter((item) => Boolean(item.userId));
  }, [userExercises]);

  useEffect(() => {
    setSelectedActivityType(activityType ?? initialExercise?.activityType ?? null);
  }, [activityType, initialExercise]);

  const validateStep = (stepToValidate: FormStep): boolean => {
    const nextErrors: FormErrors = {};

    if (stepToValidate >= 1) {
      if (!exercise.name.trim()) {
        nextErrors.name = 'Please enter an activity name.';
      } else if (exercise.name.trim().length < 3) {
        nextErrors.name = 'Name must be at least 3 characters.';
      }

      if (!exercise.description.trim()) {
        nextErrors.description = 'Please add a short description.';
      } else if (exercise.description.trim().length < 10) {
        nextErrors.description = 'Description should be at least 10 characters.';
      }
    }

    if (stepToValidate >= 2) {
      if (!exercise.targetAreas.length) {
        nextErrors.targetAreas = 'Select at least one target area.';
      }

      if (!exercise.instructions.trim()) {
        nextErrors.instructions = 'Please provide instructions.';
      } else if (exercise.instructions.trim().length < 10) {
        nextErrors.instructions = 'Instructions should be at least 10 characters.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleTargetAreaToggle = (area: GeneralTargetArea) => {
    setExercise((prev) => ({
      ...prev,
      targetAreas: prev.targetAreas.includes(area)
        ? prev.targetAreas.filter((value) => value !== area)
        : [...prev.targetAreas, area]
    }));
  };

  const handleEquipmentToggle = (equipmentItem: Equipment) => {
    setExercise((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equipmentItem)
        ? prev.equipment.filter((value) => value !== equipmentItem)
        : [...prev.equipment, equipmentItem]
    }));
  };

  const checkDuplicate = async (): Promise<Exercise | null> => {
    if (!user?.id || !selectedActivityType || !exercise.name.trim()) {
      setDuplicateExercise(null);
      return null;
    }

    const duplicate = await findDuplicateExerciseByName(
      selectedActivityType,
      exercise.name,
      user.id,
      editingExerciseId ?? undefined
    );

    setDuplicateExercise(duplicate);

    if (duplicate) {
      setErrors((prev) => ({
        ...prev,
        name: 'This name already exists for this activity type. Edit existing instead.'
      }));
    }

    return duplicate;
  };

  const loadExerciseForEdit = (exerciseToEdit: Exercise) => {
    setEditingExerciseId(exerciseToEdit.id);
    setSelectedActivityType(exerciseToEdit.activityType ?? ActivityType.OTHER);
    setExercise(getFormFromExercise(exerciseToEdit));
    setStep(1);
    setErrors({});
    setDuplicateExercise(null);
  };

  const handleDeleteCustomExercise = async () => {
    if (!user?.id || !deleteCandidate?.id) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCustomExerciseById(deleteCandidate.id, user.id);
      toast.success('Custom activity deleted.');
      if (editingExerciseId === deleteCandidate.id) {
        setEditingExerciseId(null);
        setExercise(getFormFromExercise(undefined, searchQuery));
      }
      setDeleteCandidate(null);
    } catch (error) {
      console.error('Failed to delete custom activity:', error);
      toast.error('Could not delete this activity. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast.error('You must be logged in to create activities.');
      return;
    }

    if (!selectedActivityType) {
      toast.error('Please choose an activity type first.');
      return;
    }

    if (!validateStep(2)) {
      toast.error('Please fix the required fields before saving.');
      return;
    }

    const duplicate = await checkDuplicate();
    if (duplicate) {
      toast.error('Duplicate name detected. Try editing the existing activity.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && editingExerciseId) {
        await updateExerciseByActivityType(editingExerciseId, selectedActivityType, exercise, user.id);
        toast.success('Activity updated successfully.');
        onSuccess?.(editingExerciseId);
      } else {
        const exerciseId = await createExerciseByActivityType(selectedActivityType, exercise, user.id);
        toast.success('Activity created successfully.');
        onSuccess?.(exerciseId);
      }
      onClose();
    } catch (error) {
      if (error instanceof DuplicateExerciseNameError) {
        setDuplicateExercise(error.duplicateExercise);
        setErrors((prev) => ({
          ...prev,
          name: 'This name already exists for this activity type. Edit existing instead.'
        }));
        toast.error('Duplicate name detected.');
      } else {
        console.error('Error saving activity:', error);
        toast.error('Failed to save activity. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityTypeTitle = (currentActivityType: ActivityType | null) => {
    switch (currentActivityType) {
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
        return 'New Activity';
    }
  };

  const activityTypeOptions = [
    {
      value: ActivityType.RESISTANCE,
      label: 'Resistance Training',
      description: 'Strength and load-based activities',
      icon: '🏋️'
    },
    {
      value: ActivityType.SPORT,
      label: 'Sports',
      description: 'Team and individual sports',
      icon: '⚽'
    },
    {
      value: ActivityType.STRETCHING,
      label: 'Stretching & Flexibility',
      description: 'Mobility and recovery activities',
      icon: '🧘'
    },
    {
      value: ActivityType.ENDURANCE,
      label: 'Endurance Training',
      description: 'Running, cycling, and cardio',
      icon: '🏃'
    },
    {
      value: ActivityType.SPEED_AGILITY,
      label: 'Speed & Agility',
      description: 'Drills and quickness work',
      icon: '⚡'
    },
    {
      value: ActivityType.OTHER,
      label: 'Other Activities',
      description: 'Anything else you track',
      icon: '🎯'
    }
  ];

  const previewTargetAreas = exercise.targetAreas.slice(0, 4);
  const previewEquipment = exercise.equipment.slice(0, 3);

  if (!selectedActivityType) {
    return (
      <div className="fixed inset-0 z-80 overflow-y-auto bg-black/60 p-4">
        <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-border bg-bg-secondary p-4 shadow-lg sm:p-6">
          <div className="mb-4 text-center">
            <h3 className="text-lg font-semibold text-text-primary">Select Activity Type</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Choose where this activity belongs before adding details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activityTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedActivityType(option.value)}
                className="rounded-xl border border-border bg-bg-primary p-4 text-left transition-colors hover:border-accent-primary"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl" aria-hidden="true">{option.icon}</span>
                  <div>
                    <p className="font-medium text-text-primary">{option.label}</p>
                    <p className="mt-1 text-sm text-text-secondary">{option.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 inline-flex w-full justify-center rounded-lg border border-border bg-bg-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-80 overflow-y-auto bg-black/60 p-4">
      <div className="mx-auto mt-4 grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-bg-secondary p-4 shadow-lg sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {isEditMode ? 'Edit Custom Activity' : `Create ${getActivityTypeTitle(selectedActivityType)}`}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">Build your activity in three clear steps.</p>
              {allowActivityTypeSelection && (
                <button
                  type="button"
                  onClick={() => setSelectedActivityType(null)}
                  className="mt-2 text-xs text-accent-primary hover:underline"
                >
                  Change activity type
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm">
              {(['Basics', 'Details', 'Review'] as const).map((label, index) => {
                const stepNumber = (index + 1) as FormStep;
                const isActive = step === stepNumber;
                const isDone = step > stepNumber;

                return (
                  <React.Fragment key={label}>
                    <button
                      type="button"
                      onClick={() => {
                        if (stepNumber <= step || validateStep((stepNumber - 1) as FormStep)) {
                          setStep(stepNumber);
                        }
                      }}
                      className={`rounded-full px-3 py-1 ${
                        isActive
                          ? 'bg-accent-primary text-white'
                          : isDone
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-bg-primary text-text-secondary'
                      }`}
                    >
                      {label}
                    </button>
                    {index < 2 && <span className="text-text-secondary">→</span>}
                  </React.Fragment>
                );
              })}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-primary">
                    Activity Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="mt-1 block w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:outline-none"
                    value={exercise.name}
                    onBlur={checkDuplicate}
                    onChange={(event) => {
                      const nextName = event.target.value;
                      setExercise((prev) => ({ ...prev, name: nextName }));
                      if (normalizeExerciseName(nextName) !== normalizeExerciseName(duplicateExercise?.name ?? '')) {
                        setDuplicateExercise(null);
                      }
                    }}
                    placeholder="e.g., Dumbbell Incline Press"
                  />
                  <p className="mt-1 text-xs text-text-secondary">
                    Tip: pick a clear name so it is easy to find later.
                  </p>
                  {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                </div>

                {duplicateExercise && (
                  <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
                    <p className="font-medium">Duplicate detected</p>
                    <p className="mt-1">
                      “{duplicateExercise.name}” already exists in {selectedActivityType}. You can edit it instead of creating a duplicate.
                    </p>
                    <button
                      type="button"
                      onClick={() => loadExerciseForEdit(duplicateExercise)}
                      className="mt-2 text-xs font-medium text-red-200 underline"
                    >
                      Load existing activity for editing
                    </button>
                  </div>
                )}

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-text-primary">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:outline-none"
                    value={exercise.description}
                    onChange={(event) => setExercise((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Describe what this activity focuses on."
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
                </div>

                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-text-primary">
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    className="mt-1 block w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary focus:border-accent-primary focus:outline-none"
                    value={exercise.difficulty}
                    onChange={(event) =>
                      setExercise((prev) => ({
                        ...prev,
                        difficulty: event.target.value as UniversalExerciseFormData['difficulty']
                      }))
                    }
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep(1)) {
                      setStep(2);
                    }
                  }}
                  className="inline-flex w-full justify-center rounded-lg bg-accent-primary px-4 py-2 font-medium text-white hover:bg-accent-primary/90"
                >
                  Continue to Details
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <label className="block text-sm font-medium text-text-primary">Target Areas *</label>
                    <span className="cursor-help text-xs text-text-secondary" title="Select one or more body areas or performance focus zones.">
                      ⓘ
                    </span>
                  </div>
                  <div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border bg-bg-primary p-2">
                    {generalTargetAreas.map((area) => (
                      <button
                        key={area}
                        type="button"
                        className={`rounded-full px-3 py-1 text-sm transition-colors ${
                          exercise.targetAreas.includes(area)
                            ? 'bg-accent-primary text-white'
                            : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                        }`}
                        onClick={() => handleTargetAreaToggle(area)}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                  {errors.targetAreas && <p className="mt-1 text-sm text-red-400">{errors.targetAreas}</p>}
                </div>

                {(selectedActivityType === ActivityType.SPORT ||
                  selectedActivityType === ActivityType.ENDURANCE ||
                  selectedActivityType === ActivityType.SPEED_AGILITY ||
                  selectedActivityType === ActivityType.STRETCHING) && (
                  <div>
                    {selectedActivityType === ActivityType.SPORT && (
                      <>
                        <label htmlFor="sportType" className="block text-sm font-medium text-text-primary">
                          Sport Type
                        </label>
                        <select
                          id="sportType"
                          className="mt-1 block w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary focus:border-accent-primary focus:outline-none"
                          value={exercise.sportType || ''}
                          onChange={(event) =>
                            setExercise((prev) => ({ ...prev, sportType: event.target.value as SportType }))
                          }
                        >
                          <option value="">Select sport type...</option>
                          {sportTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </>
                    )}

                    {selectedActivityType === ActivityType.ENDURANCE && (
                      <>
                        <label htmlFor="enduranceCategory" className="block text-sm font-medium text-text-primary">
                          Endurance Category
                        </label>
                        <select
                          id="enduranceCategory"
                          className="mt-1 block w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary focus:border-accent-primary focus:outline-none"
                          value={exercise.enduranceCategory || ''}
                          onChange={(event) =>
                            setExercise((prev) => ({
                              ...prev,
                              enduranceCategory: event.target.value as EnduranceCategory
                            }))
                          }
                        >
                          <option value="">Select category...</option>
                          {enduranceCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </>
                    )}

                    {selectedActivityType === ActivityType.SPEED_AGILITY && (
                      <>
                        <label htmlFor="drillType" className="block text-sm font-medium text-text-primary">
                          Drill Type
                        </label>
                        <select
                          id="drillType"
                          className="mt-1 block w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary focus:border-accent-primary focus:outline-none"
                          value={exercise.drillType || ''}
                          onChange={(event) =>
                            setExercise((prev) => ({ ...prev, drillType: event.target.value as DrillType }))
                          }
                        >
                          <option value="">Select drill type...</option>
                          {drillTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </>
                    )}

                    {selectedActivityType === ActivityType.STRETCHING && (
                      <>
                        <label htmlFor="flexibilityType" className="block text-sm font-medium text-text-primary">
                          Flexibility Type
                        </label>
                        <select
                          id="flexibilityType"
                          className="mt-1 block w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary focus:border-accent-primary focus:outline-none"
                          value={exercise.flexibilityType || ''}
                          onChange={(event) =>
                            setExercise((prev) => ({
                              ...prev,
                              flexibilityType: event.target.value as FlexibilityType
                            }))
                          }
                        >
                          <option value="">Select flexibility type...</option>
                          {flexibilityTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <label className="block text-sm font-medium text-text-primary">Equipment</label>
                    <span className="cursor-help text-xs text-text-secondary" title="Choose all tools needed for the activity.">
                      ⓘ
                    </span>
                  </div>
                  <div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border bg-bg-primary p-2">
                    {equipmentOptions.map((equipmentItem) => (
                      <button
                        key={equipmentItem}
                        type="button"
                        className={`rounded-full px-3 py-1 text-sm transition-colors ${
                          exercise.equipment.includes(equipmentItem)
                            ? 'bg-green-600 text-white'
                            : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                        }`}
                        onClick={() => handleEquipmentToggle(equipmentItem)}
                      >
                        {equipmentItem}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-text-primary">
                    Instructions *
                  </label>
                  <textarea
                    id="instructions"
                    rows={4}
                    className="mt-1 block w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:outline-none"
                    value={exercise.instructions}
                    onChange={(event) => setExercise((prev) => ({ ...prev, instructions: event.target.value }))}
                    placeholder="Step-by-step instructions for this activity."
                  />
                  {errors.instructions && <p className="mt-1 text-sm text-red-400">{errors.instructions}</p>}
                </div>

                <div>
                  <label htmlFor="tips" className="block text-sm font-medium text-text-primary">
                    Tips & Notes
                  </label>
                  <textarea
                    id="tips"
                    rows={2}
                    className="mt-1 block w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:outline-none"
                    value={exercise.tips}
                    onChange={(event) => setExercise((prev) => ({ ...prev, tips: event.target.value }))}
                    placeholder="Optional cues, reminders, or safety notes."
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex w-full justify-center rounded-lg border border-border bg-bg-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep(2)) {
                        setStep(3);
                      }
                    }}
                    className="inline-flex w-full justify-center rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white hover:bg-accent-primary/90"
                  >
                    Review
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-bg-primary p-4">
                  <h4 className="font-medium text-text-primary">Ready to save</h4>
                  <p className="mt-1 text-sm text-text-secondary">
                    Please confirm details. You can still go back to edit fields.
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-text-secondary">
                    <li>
                      <span className="text-text-primary">Name:</span> {exercise.name || 'Not set'}
                    </li>
                    <li>
                      <span className="text-text-primary">Type:</span> {selectedActivityType}
                    </li>
                    <li>
                      <span className="text-text-primary">Targets:</span> {exercise.targetAreas.join(', ') || 'None selected'}
                    </li>
                    <li>
                      <span className="text-text-primary">Equipment:</span> {exercise.equipment.join(', ') || 'None selected'}
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex w-full justify-center rounded-lg border border-border bg-bg-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex w-full justify-center rounded-lg border border-border bg-bg-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full justify-center rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white hover:bg-accent-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : isEditMode ? 'Update Activity' : 'Create Activity'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-bg-secondary p-4 shadow-lg">
            <h4 className="text-sm font-semibold text-text-primary">Live Preview</h4>
            <div className="mt-3 rounded-lg border border-border bg-bg-primary p-3">
              <p className="font-medium text-text-primary">{exercise.name || 'Untitled activity'}</p>
              <p className="mt-1 text-xs text-text-secondary">{selectedActivityType}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {previewTargetAreas.length > 0 ? (
                  previewTargetAreas.map((item) => (
                    <span key={item} className="rounded-full bg-accent-primary/10 px-2 py-0.5 text-xs text-accent-primary">
                      🎯 {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-text-secondary">Add target areas to preview them here.</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {previewEquipment.map((item) => (
                  <span key={item} className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                    🧰 {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-bg-secondary p-4 shadow-lg">
            <h4 className="text-sm font-semibold text-text-primary">Your Custom Activities</h4>
            <p className="mt-1 text-xs text-text-secondary">Edit or delete activities directly here.</p>
            <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {customExercises.length === 0 && (
                <li className="rounded-lg border border-border bg-bg-primary p-3 text-xs text-text-secondary">
                  No custom activities yet.
                </li>
              )}
              {customExercises.map((item) => (
                <li key={item.id} className="rounded-lg border border-border bg-bg-primary p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-secondary">{item.activityType}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => loadExerciseForEdit(item)}
                        className="text-xs font-medium text-accent-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(item)}
                        className="text-xs font-medium text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {deleteCandidate && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-bg-secondary p-4">
            <h5 className="text-base font-semibold text-text-primary">Delete custom activity?</h5>
            <p className="mt-2 text-sm text-text-secondary">
              This will remove “{deleteCandidate.name}”. This action cannot be undone.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomExercise}
                disabled={isDeleting}
                className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateUniversalExerciseDialog;
