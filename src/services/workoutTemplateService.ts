/**
 * Workout Template Service
 * 
 * Manages workout templates including predefined patterns and custom user templates.
 * Supports localStorage for quick access and Firestore for cross-device sync.
 */

import { 
  WorkoutTemplate, 
  PredefinedTemplate,
  TemplateCategory 
} from '@/types/workoutTemplate';
import { ExerciseSet } from '@/types/sets';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase/config';
import { getAuth } from 'firebase/auth';

// Storage keys
const CUSTOM_TEMPLATES_STORAGE = 'custom_workout_templates';

// Predefined templates that ship with the app
export const PREDEFINED_TEMPLATES: PredefinedTemplate[] = [
  {
    id: 'strength-5x5',
    name: '5×5 Strength',
    description: 'Classic strength building protocol. 5 sets of 5 reps with heavy weight.',
    category: 'strength',
    icon: '💪',
    sets: [
      { setNumber: 1, reps: 5, rest: 180, rpe: 7 },
      { setNumber: 2, reps: 5, rest: 180, rpe: 7 },
      { setNumber: 3, reps: 5, rest: 180, rpe: 8 },
      { setNumber: 4, reps: 5, rest: 180, rpe: 8 },
      { setNumber: 5, reps: 5, rest: 180, rpe: 9 }
    ]
  },
  {
    id: 'hypertrophy-3x10',
    name: '3×10 Hypertrophy',
    description: 'Muscle building with moderate weight and higher reps.',
    category: 'hypertrophy',
    icon: '🏋️',
    sets: [
      { setNumber: 1, reps: 10, rest: 90, rpe: 7 },
      { setNumber: 2, reps: 10, rest: 90, rpe: 8 },
      { setNumber: 3, reps: 10, rest: 90, rpe: 9 }
    ]
  },
  {
    id: 'pyramid-ascending',
    name: 'Pyramid (Ascending)',
    description: 'Increase weight and decrease reps each set.',
    category: 'strength',
    icon: '📈',
    sets: [
      { setNumber: 1, reps: 12, weightPercent: 60, rest: 60 },
      { setNumber: 2, reps: 10, weightPercent: 70, rest: 90 },
      { setNumber: 3, reps: 8, weightPercent: 80, rest: 120 },
      { setNumber: 4, reps: 6, weightPercent: 85, rest: 150 },
      { setNumber: 5, reps: 4, weightPercent: 90, rest: 180 }
    ]
  },
  {
    id: 'pyramid-descending',
    name: 'Pyramid (Descending)',
    description: 'Start heavy and decrease weight while increasing reps.',
    category: 'hypertrophy',
    icon: '📉',
    sets: [
      { setNumber: 1, reps: 4, weightPercent: 90, rest: 180 },
      { setNumber: 2, reps: 6, weightPercent: 85, rest: 150 },
      { setNumber: 3, reps: 8, weightPercent: 80, rest: 120 },
      { setNumber: 4, reps: 10, weightPercent: 70, rest: 90 },
      { setNumber: 5, reps: 12, weightPercent: 60, rest: 60 }
    ]
  },
  {
    id: 'drop-sets',
    name: 'Drop Sets',
    description: 'Reach failure, then immediately reduce weight and continue.',
    category: 'hypertrophy',
    icon: '⚡',
    sets: [
      { setNumber: 1, reps: 8, weightPercent: 100, rest: 120, notes: 'To failure' },
      { setNumber: 2, reps: 'AMRAP', weightPercent: 75, rest: 10, notes: 'Drop 25%, no rest' },
      { setNumber: 3, reps: 'AMRAP', weightPercent: 50, rest: 10, notes: 'Drop to 50%, no rest' }
    ]
  },
  {
    id: 'german-volume',
    name: 'German Volume (10×10)',
    description: 'High volume training for muscle growth. 10 sets of 10 reps.',
    category: 'hypertrophy',
    icon: '🔥',
    sets: Array.from({ length: 10 }, (_, i) => ({
      setNumber: i + 1,
      reps: 10,
      rest: 60,
      weightPercent: 60
    }))
  },
  {
    id: 'rest-pause',
    name: 'Rest-Pause',
    description: 'High intensity with short rest periods between mini-sets.',
    category: 'strength',
    icon: '⏸️',
    sets: [
      { setNumber: 1, reps: 6, rest: 180, rpe: 9 },
      { setNumber: 2, reps: 3, rest: 20, rpe: 10, notes: 'Rest-pause' },
      { setNumber: 3, reps: 2, rest: 20, rpe: 10, notes: 'Rest-pause' },
      { setNumber: 4, reps: 1, rest: 20, rpe: 10, notes: 'Rest-pause' }
    ]
  },
  {
    id: 'wave-loading',
    name: 'Wave Loading',
    description: 'Undulating intensity across multiple waves.',
    category: 'power',
    icon: '🌊',
    sets: [
      { setNumber: 1, reps: 5, weightPercent: 80, rest: 120 },
      { setNumber: 2, reps: 3, weightPercent: 85, rest: 150 },
      { setNumber: 3, reps: 1, weightPercent: 90, rest: 180 },
      { setNumber: 4, reps: 5, weightPercent: 82, rest: 120 },
      { setNumber: 5, reps: 3, weightPercent: 87, rest: 150 },
      { setNumber: 6, reps: 1, weightPercent: 92, rest: 180 }
    ]
  }
];

/**
 * Get the current authenticated user ID
 */
const getCurrentUserId = (): string => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('User must be authenticated');
  }
  return userId;
};

/**
 * Get all predefined templates
 */
export const getPredefinedTemplates = (): WorkoutTemplate[] => {
  return PREDEFINED_TEMPLATES.map(template => ({
    ...template,
    isDefault: true
  }));
};

/**
 * Get a specific predefined template by ID
 */
export const getPredefinedTemplate = (templateId: string): WorkoutTemplate | null => {
  const template = PREDEFINED_TEMPLATES.find(t => t.id === templateId);
  return template ? { ...template, isDefault: true } : null;
};

/**
 * Get custom templates from localStorage
 */
export const getCustomTemplatesFromStorage = (): WorkoutTemplate[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE);
    if (!stored) return [];
    
    const templates = JSON.parse(stored);
    return templates.map((t: any) => ({
      ...t,
      createdAt: t.createdAt ? new Date(t.createdAt) : undefined
    }));
  } catch (error) {
    console.error('Error loading custom templates from localStorage:', error);
    return [];
  }
};

/**
 * Save custom templates to localStorage
 */
const saveCustomTemplatesToStorage = (templates: WorkoutTemplate[]): void => {
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_STORAGE, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving custom templates to localStorage:', error);
  }
};

/**
 * Get all templates (predefined + custom)
 */
export const getAllTemplates = async (useFirestore: boolean = true): Promise<WorkoutTemplate[]> => {
  const predefined = getPredefinedTemplates();
  
  if (!useFirestore) {
    const customLocal = getCustomTemplatesFromStorage();
    return [...predefined, ...customLocal];
  }

  try {
    const userId = getCurrentUserId();
    const customFirestore = await getCustomTemplatesFromFirestore(userId);
    
    // Merge with localStorage (Firestore takes precedence)
    const customLocal = getCustomTemplatesFromStorage();
    const firestoreIds = new Set(customFirestore.map(t => t.id));
    const localOnly = customLocal.filter(t => !firestoreIds.has(t.id));
    
    return [...predefined, ...customFirestore, ...localOnly];
  } catch (error) {
    console.error('Error fetching templates from Firestore, using localStorage:', error);
    const customLocal = getCustomTemplatesFromStorage();
    return [...predefined, ...customLocal];
  }
};

/**
 * Get custom templates from Firestore
 */
export const getCustomTemplatesFromFirestore = async (userId: string): Promise<WorkoutTemplate[]> => {
  try {
    const templatesRef = collection(db, 'users', userId, 'workoutTemplates');
    const querySnapshot = await getDocs(templatesRef);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        sets: data.sets,
        isDefault: false,
        userId: data.userId,
        createdAt: data.createdAt?.toDate(),
        category: data.category
      } as WorkoutTemplate;
    });
  } catch (error) {
    console.error('Error fetching templates from Firestore:', error);
    throw error;
  }
};

/**
 * Create a new custom template
 */
export const createCustomTemplate = async (
  template: Omit<WorkoutTemplate, 'id' | 'isDefault' | 'userId' | 'createdAt'>,
  saveToFirestore: boolean = true
): Promise<WorkoutTemplate> => {
  const newTemplate: WorkoutTemplate = {
    ...template,
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isDefault: false,
    createdAt: new Date()
  };

  // Save to localStorage
  const customTemplates = getCustomTemplatesFromStorage();
  customTemplates.push(newTemplate);
  saveCustomTemplatesToStorage(customTemplates);

  // Save to Firestore if enabled
  if (saveToFirestore) {
    try {
      const userId = getCurrentUserId();
      newTemplate.userId = userId;
      
      const templateRef = doc(db, 'users', userId, 'workoutTemplates', newTemplate.id);
      await setDoc(templateRef, {
        name: newTemplate.name,
        description: newTemplate.description,
        sets: newTemplate.sets,
        userId: userId,
        category: newTemplate.category,
        createdAt: Timestamp.fromDate(newTemplate.createdAt!)
      });
    } catch (error) {
      console.error('Error saving template to Firestore:', error);
      // Continue - template is still saved locally
    }
  }

  return newTemplate;
};

/**
 * Update an existing custom template
 */
export const updateCustomTemplate = async (
  templateId: string,
  updates: Partial<Omit<WorkoutTemplate, 'id' | 'isDefault' | 'userId' | 'createdAt'>>,
  saveToFirestore: boolean = true
): Promise<WorkoutTemplate> => {
  // Update localStorage
  const customTemplates = getCustomTemplatesFromStorage();
  const index = customTemplates.findIndex(t => t.id === templateId);
  
  if (index === -1) {
    throw new Error('Template not found');
  }

  customTemplates[index] = {
    ...customTemplates[index],
    ...updates
  };
  
  saveCustomTemplatesToStorage(customTemplates);

  // Update Firestore if enabled
  if (saveToFirestore) {
    try {
      const userId = getCurrentUserId();
      const templateRef = doc(db, 'users', userId, 'workoutTemplates', templateId);
      await setDoc(templateRef, {
        name: customTemplates[index].name,
        description: customTemplates[index].description,
        sets: customTemplates[index].sets,
        userId: userId,
        category: customTemplates[index].category,
        createdAt: Timestamp.fromDate(customTemplates[index].createdAt!)
      }, { merge: true });
    } catch (error) {
      console.error('Error updating template in Firestore:', error);
    }
  }

  return customTemplates[index];
};

/**
 * Delete a custom template
 */
export const deleteCustomTemplate = async (
  templateId: string,
  deleteFromFirestore: boolean = true
): Promise<void> => {
  // Cannot delete predefined templates
  if (!templateId.startsWith('custom_')) {
    throw new Error('Cannot delete predefined templates');
  }

  // Delete from localStorage
  const customTemplates = getCustomTemplatesFromStorage();
  const filtered = customTemplates.filter(t => t.id !== templateId);
  saveCustomTemplatesToStorage(filtered);

  // Delete from Firestore if enabled
  if (deleteFromFirestore) {
    try {
      const userId = getCurrentUserId();
      const templateRef = doc(db, 'users', userId, 'workoutTemplates', templateId);
      await deleteDoc(templateRef);
    } catch (error) {
      console.error('Error deleting template from Firestore:', error);
    }
  }
};

/**
 * Apply a template to generate exercise sets
 * @param template The template to apply
 * @param baseWeight Optional base weight for percentage calculations (e.g., 1RM)
 * @param existingSets Existing sets to merge with template (useful for resistance training)
 */
export const applyTemplate = (
  template: WorkoutTemplate,
  baseWeight?: number,
  existingSets?: Partial<ExerciseSet>[]
): Partial<ExerciseSet>[] => {
  return template.sets.map((templateSet, index) => {
    const set: Partial<ExerciseSet> = {
      reps: typeof templateSet.reps === 'number' ? templateSet.reps : 0,
      restTime: templateSet.rest,
      rpe: templateSet.rpe,
      rir: templateSet.rir,
      duration: templateSet.duration,
      notes: templateSet.notes || '',
      comment: templateSet.notes || ''
    };

    // Calculate weight from percentage if baseWeight is provided
    if (templateSet.weightPercent && baseWeight) {
      set.weight = Math.round((baseWeight * templateSet.weightPercent) / 100);
    }

    // Handle AMRAP (As Many Reps As Possible)
    if (templateSet.reps === 'AMRAP') {
      set.notes = (set.notes || '') + ' (AMRAP)';
      set.reps = 0; // Will be filled in by user
    }

    // Merge with existing set data if provided
    if (existingSets && existingSets[index]) {
      return {
        ...set,
        ...existingSets[index]
      };
    }

    return set;
  });
};

/**
 * Get template by ID (from both predefined and custom)
 */
export const getTemplateById = async (templateId: string): Promise<WorkoutTemplate | null> => {
  // Check predefined first
  const predefined = getPredefinedTemplate(templateId);
  if (predefined) return predefined;

  // Check custom templates
  const customTemplates = await getAllTemplates();
  return customTemplates.find(t => t.id === templateId) || null;
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = async (category: TemplateCategory): Promise<WorkoutTemplate[]> => {
  const allTemplates = await getAllTemplates();
  return allTemplates.filter(t => t.category === category);
};
