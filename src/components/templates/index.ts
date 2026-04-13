// Template Components
export { default as TemplateForm } from './TemplateForm';
export { default as TemplateSelect } from './TemplateSelect';
export { default as TemplatedExerciseLogger } from './TemplatedExerciseLogger';

// Re-export types for convenience
export type {
  TrainingTemplate,
  TemplateField,
  UniversalExerciseSet,
  TemplatedLogData,
  FieldType,
  DynamicSetData
} from '@/types/trainingTemplates';

// Re-export services
export { TemplateService, type ValidationResult } from '@/services/templateService';
export { TemplatedLoggingService } from '@/services/templatedLoggingService';

// Re-export default templates
export {
  DEFAULT_TEMPLATES,
  getDefaultTemplateByType,
  getTemplateById,
  strengthTemplate,
  enduranceTemplate,
  plyometricsTemplate,
  teamSportsTemplate,
  flexibilityTemplate,
  otherTemplate
} from '@/config/defaultTemplates';
