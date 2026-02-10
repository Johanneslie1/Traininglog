import React from 'react';
import { TrainingTemplate } from '@/types/trainingTemplates';
import { ExerciseType } from '@/config/exerciseTypes';
import { TemplateService } from '@/services/templateService';

interface TemplateSelectProps {
  selectedTemplateId?: string;
  onTemplateSelect: (template: TrainingTemplate) => void;
  exerciseType?: ExerciseType;
  showCreateNew?: boolean;
  className?: string;
}

/**
 * Component for selecting training templates
 */
export const TemplateSelect: React.FC<TemplateSelectProps> = ({
  selectedTemplateId,
  onTemplateSelect,
  exerciseType,
  showCreateNew = false,
  className = ""
}) => {
  const availableTemplates = exerciseType 
    ? TemplateService.getTemplatesByType(exerciseType)
    : TemplateService.getAllTemplates();

  const handleTemplateChange = (templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId);
    if (template) {
      onTemplateSelect(template);
    }
  };

  const getTemplateIcon = (type: ExerciseType): string => {
    const icons = {
      strength: '🏋️',
      endurance: '🏃',
      plyometrics: '🦘',
      teamSports: '⚽',
      flexibility: '🧘',
      other: '🏔️',
      speedAgility: '⚡'
    };
    return icons[type] || '💪';
  };

  const getTemplateColor = (type: ExerciseType): string => {
    const colors = {
      strength: 'bg-blue-600',
      endurance: 'bg-green-600',
      plyometrics: 'bg-orange-600',
      teamSports: 'bg-purple-600',
      flexibility: 'bg-pink-600',
      other: 'bg-gray-600',
      speedAgility: 'bg-yellow-600'
    };
    return colors[type] || 'bg-blue-600';
  };

  // Group templates by type
  const groupedTemplates = availableTemplates.reduce((groups, template) => {
    const type = template.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(template);
    return groups;
  }, {} as Record<ExerciseType, TrainingTemplate[]>);

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label htmlFor="template-select" className="block text-sm font-medium text-white/90 mb-2">
          Training Template
        </label>
        
        {/* Quick template cards for specific exercise type */}
        {exerciseType && groupedTemplates[exerciseType] && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {groupedTemplates[exerciseType].map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateChange(template.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedTemplateId === template.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-border bg-bg-tertiary hover:border-border-hover'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTemplateIcon(template.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{template.name}</h3>
                    <p className="text-gray-400 text-sm truncate">{template.description}</p>
                    <div className="flex items-center mt-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${getTemplateColor(template.type)} mr-2`}></span>
                      <span className="text-xs text-gray-500 capitalize">{template.type}</span>
                      {template.isDefault && (
                        <span className="ml-2 text-xs text-blue-400">Default</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Dropdown for all templates */}
        <select
          id="template-select"
          value={selectedTemplateId || ''}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="block w-full rounded-md border-border bg-bg-tertiary text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Select a template...</option>
          {Object.entries(groupedTemplates).map(([type, templates]) => (
            <optgroup key={type} label={`${getTemplateIcon(type as ExerciseType)} ${type.charAt(0).toUpperCase() + type.slice(1)}`}>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} {template.isDefault ? '(Default)' : '(Custom)'}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Template details */}
      {selectedTemplateId && (
        <div className="bg-bg-tertiary rounded-lg p-4 border border-border">
          {(() => {
            const template = availableTemplates.find(t => t.id === selectedTemplateId);
            if (!template) return null;

            return (
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{getTemplateIcon(template.type)}</span>
                  <div>
                    <h3 className="text-white font-medium">{template.name}</h3>
                    <p className="text-gray-400 text-sm">{template.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-white text-sm font-medium">Fields to track:</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.fields.map((field) => (
                      <span
                        key={field.fieldId}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          field.required 
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                            : 'bg-gray-600/20 text-gray-400 border border-border/30'
                        }`}
                      >
                        {field.label}
                        {field.required && <span className="ml-1 text-red-400">*</span>}
                        {field.unit && <span className="ml-1 text-gray-500">({field.unit})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Create new template option */}
      {showCreateNew && (
        <button
          onClick={() => {/* TODO: Open template creation modal */}}
          className="w-full p-3 border-2 border-dashed border-border rounded-lg text-gray-400 hover:border-border-hover hover:text-gray-300 transition-colors"
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">➕</span>
            <span>Create Custom Template</span>
          </div>
        </button>
      )}
    </div>
  );
};

export default TemplateSelect;
