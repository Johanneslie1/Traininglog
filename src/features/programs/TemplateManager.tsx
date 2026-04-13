import React, { useState, useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';
import { TrashIcon, DuplicateIcon, PlayIcon } from '@heroicons/react/outline';

interface Template {
  id: string;
  name: string;
  description?: string;
  level?: string;
  exercises: { exercise: Exercise; sets: ExerciseSet[] }[];
  sessions?: any[]; // For program templates
  createdAt: string;
  // Enhanced template metadata
  activityTypes?: ActivityType[];
  totalExercises?: number;
  isBalanced?: boolean;
  activityCounts?: Record<string, number>;
}

interface TemplateManagerProps {
  onClose: () => void;
  onUseTemplate: (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  onClose,
  onUseTemplate
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const savedTemplates = localStorage.getItem('program-templates');
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates);
        setTemplates(parsedTemplates.sort((a: Template, b: Template) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const deleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        const updatedTemplates = templates.filter(t => t.id !== templateId);
        localStorage.setItem('program-templates', JSON.stringify(updatedTemplates));
        setTemplates(updatedTemplates);
        
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
          setShowPreview(false);
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template');
      }
    }
  };

  const duplicateTemplate = (template: Template) => {
    try {
      const newTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (Copy)`,
        createdAt: new Date().toISOString()
      };

      const updatedTemplates = [...templates, newTemplate];
      localStorage.setItem('program-templates', JSON.stringify(updatedTemplates));
      setTemplates(updatedTemplates.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template');
    }
  };

  const handleUseTemplate = (template: Template) => {
    onUseTemplate(template.exercises);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get activity type display info
  const getActivityTypeInfo = (activityType: ActivityType) => {
    switch (activityType) {
      case ActivityType.RESISTANCE:
        return { label: 'Resistance', color: 'bg-blue-600', textColor: 'text-blue-100' };
      case ActivityType.SPORT:
        return { label: 'Sport', color: 'bg-green-600', textColor: 'text-green-100' };
      case ActivityType.STRETCHING:
        return { label: 'Stretching', color: 'bg-purple-600', textColor: 'text-purple-100' };
      case ActivityType.ENDURANCE:
        return { label: 'Endurance', color: 'bg-orange-600', textColor: 'text-orange-100' };
      case ActivityType.SPEED_AGILITY:
        return { label: 'Speed/Agility', color: 'bg-red-600', textColor: 'text-red-100' };
      case ActivityType.OTHER:
        return { label: 'Other', color: 'bg-gray-600', textColor: 'text-gray-100' };
      default:
        return { label: 'Resistance', color: 'bg-blue-600', textColor: 'text-blue-100' };
    }
  };

  const showTemplatePreview = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
        <div className="bg-[#23272F] rounded-lg w-full max-w-4xl h-5/6 flex flex-col shadow-xl">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Program Templates</h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-gray-400 mt-2">
              Use saved templates to quickly create new programs
            </p>
          </div>

          {/* Template List */}
          <div className="flex-1 overflow-y-auto p-6">
            {templates.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-lg flex items-center justify-center">
                  <DuplicateIcon className="w-8 h-8" />
                </div>
                <p className="text-lg mb-2">No templates saved yet</p>
                <p className="text-sm">Create a program and save it as a template to see it here</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-[#181A20] rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-lg mb-1">{template.name}</h3>
                        <div className="text-sm text-gray-400">
                          {template.totalExercises || template.exercises.length} exercise{(template.totalExercises || template.exercises.length) !== 1 ? 's' : ''}
                          {template.sessions && ` • ${template.sessions.length} session${template.sessions.length !== 1 ? 's' : ''}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Created {formatDate(template.createdAt)}
                        </div>
                        
                        {/* Activity Type Badges */}
                        {template.activityTypes && template.activityTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.activityTypes.slice(0, 3).map(type => {
                              const typeInfo = getActivityTypeInfo(type);
                              const count = template.activityCounts?.[type] || 0;
                              return (
                                <span 
                                  key={type} 
                                  className={`px-2 py-0.5 text-xs rounded-full ${typeInfo.color} ${typeInfo.textColor}`}
                                  title={`${count} ${typeInfo.label.toLowerCase()} exercise${count !== 1 ? 's' : ''}`}
                                >
                                  {typeInfo.label} {count > 0 && `(${count})`}
                                </span>
                              );
                            })}
                            {template.activityTypes.length > 3 && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-600 text-gray-100">
                                +{template.activityTypes.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Balance Indicator */}
                        {template.isBalanced && (
                          <div className="text-xs text-green-400 mt-1">
                            🎯 Well-balanced program
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Exercise Preview */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-400 mb-2">Exercises:</div>
                      <div className="space-y-1">
                        {template.exercises.slice(0, 3).map((item, index) => (
                          <div key={index} className="text-sm text-gray-300 truncate">
                            • {item.exercise.name}
                          </div>
                        ))}
                        {template.exercises.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{template.exercises.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                      >
                        <PlayIcon className="w-4 h-4" />
                        Use
                      </button>
                      
                      <button
                        onClick={() => showTemplatePreview(template)}
                        className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Preview
                      </button>
                      
                      <button
                        onClick={() => duplicateTemplate(template)}
                        className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        <DuplicateIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-60">
          <div className="bg-[#23272F] rounded-lg w-full max-w-2xl max-h-5/6 flex flex-col shadow-xl">
            {/* Preview Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedTemplate.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {selectedTemplate.exercises.length} exercises • Created {formatDate(selectedTemplate.createdAt)}
                  </p>
                </div>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedTemplate.exercises.map((item, index) => (
                  <div key={index} className="bg-[#181A20] rounded-lg p-4 border border-white/10">
                    <h4 className="text-white font-medium mb-3">{item.exercise.name}</h4>
                    
                    <div className="space-y-2">
                      {item.sets.map((set, setIndex) => (
                        <div key={setIndex} className="flex items-center gap-4 text-sm">
                          <span className="text-gray-400 w-8">#{setIndex + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-text-primary">{set.weight || 0}kg</span>
                            <span className="text-gray-400">×</span>
                            <span className="text-text-primary">{set.reps || 0} reps</span>
                            {set.difficulty && (
                              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                                {set.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {item.exercise.description && (
                      <div className="mt-3 text-sm text-gray-400">
                        {item.exercise.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Footer */}
            <div className="p-6 border-t border-white/10">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleUseTemplate(selectedTemplate);
                    setShowPreview(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplateManager;
