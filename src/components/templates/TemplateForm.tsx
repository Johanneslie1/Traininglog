import React, { useState } from 'react';
import { TrainingTemplate, TemplateField, UniversalExerciseSet } from '@/types/trainingTemplates';

interface TemplateFormProps {
  template: TrainingTemplate;
  setData: UniversalExerciseSet;
  onUpdate: (fieldId: string, value: any) => void;
  errors?: Record<string, string>;
  showLabels?: boolean;
  compact?: boolean;
}

/**
 * Dynamic form component that renders fields based on a training template
 */
export const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  setData,
  onUpdate,
  errors = {},
  showLabels = true,
  compact = false
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateField = (field: TemplateField, value: any): string | null => {
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label} is required`;
    }

    if (value !== undefined && value !== null && value !== '') {
      if (field.validation) {
        const validation = field.validation;
        
        if (validation.min !== undefined && Number(value) < validation.min) {
          return `${field.label} must be at least ${validation.min}`;
        }
        
        if (validation.max !== undefined && Number(value) > validation.max) {
          return `${field.label} must be at most ${validation.max}`;
        }
        
        if (validation.pattern && !new RegExp(validation.pattern).test(String(value))) {
          return `${field.label} format is invalid`;
        }
        
        if (validation.custom && typeof validation.custom === 'function') {
          const customResult = validation.custom(value);
          if (customResult !== true) {
            return typeof customResult === 'string' ? customResult : `${field.label} is invalid`;
          }
        }
      }

      // Field-level min/max validation
      if (field.min !== undefined && Number(value) < field.min) {
        return `${field.label} must be at least ${field.min}`;
      }
      
      if (field.max !== undefined && Number(value) > field.max) {
        return `${field.label} must be at most ${field.max}`;
      }
    }

    return null;
  };

  const handleChange = (field: TemplateField, value: any) => {
    // Clear validation error for this field
    if (validationErrors[field.fieldId]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field.fieldId];
        return updated;
      });
    }

    // Validate the new value
    const error = validateField(field, value);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field.fieldId]: error }));
    }

    onUpdate(field.fieldId, value);
  };

  const renderField = (field: TemplateField) => {
    const value = setData[field.fieldId];
    const error = errors[field.fieldId] || validationErrors[field.fieldId];
    const fieldId = `${template.id}-${field.fieldId}`;

    const baseInputClasses = compact
      ? "block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white text-sm px-2 py-1 focus:border-blue-500 focus:ring-blue-500"
      : "block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm";

    const errorClasses = error ? "border-red-500 ring-red-500" : "";

    const renderInput = () => {
      switch (field.type) {
        case 'number':
        case 'weight':
        case 'reps':
        case 'heartRate':
        case 'intensity':
        case 'rpe':
          return (
            <div className="relative">
              <input
                type="number"
                id={fieldId}
                className={`${baseInputClasses} ${errorClasses} ${field.unit ? 'pr-12' : ''}`}
                value={value || ''}
                onChange={(e) => handleChange(field, Number(e.target.value))}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step || 1}
                required={field.required}
              />
              {field.unit && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">{field.unit}</span>
                </div>
              )}
            </div>
          );

        case 'duration':
          return (
            <div className="relative">
              <input
                type="number"
                id={fieldId}
                className={`${baseInputClasses} ${errorClasses} pr-12`}
                value={value || ''}
                onChange={(e) => handleChange(field, Number(e.target.value))}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step || 1}
                required={field.required}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">min</span>
              </div>
            </div>
          );

        case 'distance':
          return (
            <div className="relative">
              <input
                type="number"
                id={fieldId}
                className={`${baseInputClasses} ${errorClasses} pr-12`}
                value={value || ''}
                onChange={(e) => handleChange(field, Number(e.target.value))}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step || 0.1}
                required={field.required}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">{field.unit || 'km'}</span>
              </div>
            </div>
          );

        case 'string':
          return (
            <input
              type="text"
              id={fieldId}
              className={`${baseInputClasses} ${errorClasses}`}
              value={value || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          );

        case 'select':
          return (
            <select
              id={fieldId}
              className={`${baseInputClasses} ${errorClasses}`}
              value={value || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );

        case 'boolean':
          return (
            <div className="flex items-center">
              <input
                type="checkbox"
                id={fieldId}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={value || false}
                onChange={(e) => handleChange(field, e.target.checked)}
              />
              <label htmlFor={fieldId} className="ml-2 block text-sm text-white">
                {field.label}
              </label>
            </div>
          );

        default:
          return (
            <input
              type="text"
              id={fieldId}
              className={`${baseInputClasses} ${errorClasses}`}
              value={value || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          );
      }
    };

    if (field.type === 'boolean') {
      return renderInput(); // Boolean fields render their own label
    }

    return (
      <div className={compact ? "space-y-1" : "space-y-2"}>
        {showLabels && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-white/90">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
            {field.unit && !field.type.includes('duration') && !field.type.includes('distance') && (
              <span className="text-gray-400 ml-1">({field.unit})</span>
            )}
          </label>
        )}
        {renderInput()}
        {error && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-${compact ? '3' : '4'}`}>
      {template.fields.map((field) => (
        <div key={field.fieldId}>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
};

export default TemplateForm;
