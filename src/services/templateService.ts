import { TrainingTemplate, TemplatedLogData, UniversalExerciseSet } from '@/types/trainingTemplates';
import { ExerciseType } from '@/config/exerciseTypes';
import { DEFAULT_TEMPLATES, getDefaultTemplateByType } from '@/config/defaultTemplates';

/**
 * Service for managing training templates
 */
export class TemplateService {
  private static customTemplates: TrainingTemplate[] = [];

  /**
   * Get all available templates (default + custom)
   */
  static getAllTemplates(): TrainingTemplate[] {
    return [...DEFAULT_TEMPLATES, ...this.customTemplates];
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): TrainingTemplate | undefined {
    return this.getAllTemplates().find(template => template.id === id);
  }

  /**
   * Get templates by training type
   */
  static getTemplatesByType(type: ExerciseType): TrainingTemplate[] {
    return this.getAllTemplates().filter(template => template.type === type);
  }

  /**
   * Get the default template for a training type
   */
  static getDefaultTemplate(type: ExerciseType): TrainingTemplate | undefined {
    return getDefaultTemplateByType(type);
  }

  /**
   * Create a new custom template
   */
  static createCustomTemplate(template: Omit<TrainingTemplate, 'id'>): TrainingTemplate {
    const newTemplate: TrainingTemplate = {
      ...template,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isDefault: false
    };

    this.customTemplates.push(newTemplate);
    this.saveCustomTemplates();
    return newTemplate;
  }

  /**
   * Update an existing custom template
   */
  static updateTemplate(id: string, updates: Partial<TrainingTemplate>): TrainingTemplate | null {
    const templateIndex = this.customTemplates.findIndex(t => t.id === id);
    if (templateIndex === -1) return null;

    this.customTemplates[templateIndex] = {
      ...this.customTemplates[templateIndex],
      ...updates,
      id // Ensure ID doesn't change
    };

    this.saveCustomTemplates();
    return this.customTemplates[templateIndex];
  }

  /**
   * Delete a custom template
   */
  static deleteTemplate(id: string): boolean {
    const initialLength = this.customTemplates.length;
    this.customTemplates = this.customTemplates.filter(t => t.id !== id);
    
    if (this.customTemplates.length < initialLength) {
      this.saveCustomTemplates();
      return true;
    }
    return false;
  }

  /**
   * Validate log data against template
   */
  static validateLogData(templateId: string, logData: TemplatedLogData): ValidationResult {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return { isValid: false, errors: ['Template not found'] };
    }

    const errors: string[] = [];

    // Validate each set against template fields
    logData.sets.forEach((set, setIndex) => {
      template.fields.forEach(field => {
        if (field.required && (set[field.fieldId] === undefined || set[field.fieldId] === null || set[field.fieldId] === '')) {
          errors.push(`Set ${setIndex + 1}: ${field.label} is required`);
        }

        // Type-specific validations
        const value = set[field.fieldId];
        if (value !== undefined && value !== null && value !== '') {
          if (field.validation) {
            const validation = field.validation;
            if (validation.min !== undefined && Number(value) < validation.min) {
              errors.push(`Set ${setIndex + 1}: ${field.label} must be at least ${validation.min}`);
            }
            if (validation.max !== undefined && Number(value) > validation.max) {
              errors.push(`Set ${setIndex + 1}: ${field.label} must be at most ${validation.max}`);
            }
            if (validation.pattern && !new RegExp(validation.pattern).test(String(value))) {
              errors.push(`Set ${setIndex + 1}: ${field.label} format is invalid`);
            }
            if (validation.custom && typeof validation.custom === 'function') {
              const customResult = validation.custom(value);
              if (customResult !== true) {
                errors.push(`Set ${setIndex + 1}: ${typeof customResult === 'string' ? customResult : `${field.label} is invalid`}`);
              }
            }
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create an empty set based on template
   */
  static createEmptySet(templateId: string): UniversalExerciseSet {
    const template = this.getTemplateById(templateId);
    if (!template) return {};

    const emptySet: UniversalExerciseSet = {};

    template.fields.forEach(field => {
      if (field.required) {
        switch (field.type) {
          case 'number':
          case 'weight':
          case 'reps':
          case 'duration':
          case 'distance':
          case 'heartRate':
          case 'intensity':
          case 'rpe':
            emptySet[field.fieldId] = field.min || 0;
            break;
          case 'string':
            emptySet[field.fieldId] = '';
            break;
          case 'boolean':
            emptySet[field.fieldId] = false;
            break;
          case 'select':
            emptySet[field.fieldId] = field.options?.[0] || '';
            break;
          default:
            emptySet[field.fieldId] = null;
        }
      }
    });

    return emptySet;
  }

  /**
   * Get template field by ID
   */
  static getTemplateField(templateId: string, fieldId: string) {
    const template = this.getTemplateById(templateId);
    return template?.fields.find(field => field.fieldId === fieldId);
  }

  /**
   * Save custom templates to localStorage
   */
  private static saveCustomTemplates(): void {
    try {
      localStorage.setItem('customTrainingTemplates', JSON.stringify(this.customTemplates));
    } catch (error) {
      console.error('Failed to save custom templates:', error);
    }
  }

  /**
   * Load custom templates from localStorage
   */
  static loadCustomTemplates(): void {
    try {
      const stored = localStorage.getItem('customTrainingTemplates');
      if (stored) {
        this.customTemplates = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load custom templates:', error);
      this.customTemplates = [];
    }
  }

  /**
   * Initialize the service
   */
  static initialize(): void {
    this.loadCustomTemplates();
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Initialize the service
TemplateService.initialize();
