import React, { useState, useEffect } from 'react';
import { TrainingTemplate, UniversalExerciseSet, TemplatedLogData } from '@/types/trainingTemplates';
import { ExerciseType } from '@/config/exerciseTypes';
import { TemplateService } from '@/services/templateService';
import { saveTemplatedLog, createNewSetFromTemplate } from '@/services/firebase/unifiedLogs';
import TemplateSelect from './TemplateSelect';
import TemplateForm from './TemplateForm';

interface TemplatedExerciseLoggerProps {
  userId: string;
  selectedDate: Date;
  exerciseType?: ExerciseType;
  exerciseName?: string;
  activityName?: string;
  onSave: (logId: string) => void;
  onCancel: () => void;
  existingLogId?: string;
  initialData?: TemplatedLogData;
}

/**
 * Main component for logging exercises using templates
 */
export const TemplatedExerciseLogger: React.FC<TemplatedExerciseLoggerProps> = ({
  userId,
  selectedDate,
  exerciseType,
  exerciseName,
  activityName,
  onSave,
  onCancel,
  existingLogId,
  initialData
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TrainingTemplate | null>(null);
  const [sets, setSets] = useState<UniversalExerciseSet[]>([]);
  const [currentExerciseName, setCurrentExerciseName] = useState(exerciseName || '');
  const [currentActivityName, setCurrentActivityName] = useState(activityName || '');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize with existing data or default template
  useEffect(() => {
    if (initialData && initialData.templateId) {
      const template = TemplateService.getTemplateById(initialData.templateId);
      if (template) {
        setSelectedTemplate(template);
        setSets(initialData.sets);
        setCurrentExerciseName(initialData.exerciseName || '');
        setCurrentActivityName(initialData.activityName || '');
        setNotes(initialData.notes || '');
        setCategories(initialData.categories || []);
      }
    } else if (exerciseType) {
      // Auto-select default template for exercise type
      const defaultTemplate = TemplateService.getDefaultTemplate(exerciseType);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate);
        setSets([createNewSetFromTemplate(defaultTemplate.id)]);
      }
    }
  }, [initialData, exerciseType]);

  const handleTemplateSelect = (template: TrainingTemplate) => {
    setSelectedTemplate(template);
    // Create first set if no sets exist
    if (sets.length === 0) {
      setSets([createNewSetFromTemplate(template.id)]);
    }
    setErrors({});
  };

  const handleSetUpdate = (setIndex: number, fieldId: string, value: any) => {
    setSets(prev => prev.map((set, index) => 
      index === setIndex 
        ? { ...set, [fieldId]: value }
        : set
    ));
    
    // Clear errors for this field
    const errorKey = `set-${setIndex}-${fieldId}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[errorKey];
        return updated;
      });
    }
  };

  const addSet = () => {
    if (!selectedTemplate) return;
    
    const previousSet = sets[sets.length - 1];
    const newSet = createNewSetFromTemplate(selectedTemplate.id, previousSet);
    setSets(prev => [...prev, newSet]);
  };

  const removeSet = (setIndex: number) => {
    if (sets.length > 1) {
      setSets(prev => prev.filter((_, index) => index !== setIndex));
    }
  };

  const validateData = (): boolean => {
    if (!selectedTemplate) {
      setErrors({ general: 'Please select a template' });
      return false;
    }

    const validation = TemplateService.validateLogData(selectedTemplate.id, {
      templateId: selectedTemplate.id,
      exerciseName: currentExerciseName,
      activityName: currentActivityName,
      userId,
      sets,
      exerciseType: selectedTemplate.type,
      categories,
      notes
    });

    if (!validation.isValid) {
      const newErrors: Record<string, string> = {};
      validation.errors.forEach((error, index) => {
        newErrors[`validation-${index}`] = error;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validateData() || !selectedTemplate) return;

    setSaving(true);
    try {
      const logData: TemplatedLogData = {
        templateId: selectedTemplate.id,
        exerciseName: currentExerciseName || undefined,
        activityName: currentActivityName || undefined,
        userId,
        sets,
        exerciseType: selectedTemplate.type,
        categories,
        notes: notes || undefined
      };

      const logId = await saveTemplatedLog(logData, selectedDate, existingLogId);
      onSave(logId);
    } catch (error) {
      console.error('Error saving templated log:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to save log' 
      });
    } finally {
      setSaving(false);
    }
  };

  const getExerciseTitle = () => {
    if (selectedTemplate?.type === 'strength' || selectedTemplate?.type === 'plyometrics') {
      return currentExerciseName || 'Exercise';
    }
    return currentActivityName || selectedTemplate?.name || 'Activity';
  };

  return (
    <div className="bg-bg-secondary min-h-screen text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Log Training</h1>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Exercise/Activity Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/90 mb-2">
            {selectedTemplate?.type === 'strength' || selectedTemplate?.type === 'plyometrics' 
              ? 'Exercise Name' 
              : 'Activity Name'}
          </label>
          <input
            type="text"
            value={selectedTemplate?.type === 'strength' || selectedTemplate?.type === 'plyometrics' 
              ? currentExerciseName 
              : currentActivityName}
            onChange={(e) => {
              if (selectedTemplate?.type === 'strength' || selectedTemplate?.type === 'plyometrics') {
                setCurrentExerciseName(e.target.value);
              } else {
                setCurrentActivityName(e.target.value);
              }
            }}
            className="block w-full rounded-md border-border bg-bg-tertiary text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder={`Enter ${selectedTemplate?.type === 'strength' || selectedTemplate?.type === 'plyometrics' ? 'exercise' : 'activity'} name...`}
          />
        </div>

        {/* Template Selection */}
        <TemplateSelect
          selectedTemplateId={selectedTemplate?.id}
          onTemplateSelect={handleTemplateSelect}
          exerciseType={exerciseType}
          className="mb-6"
        />

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
            <h4 className="text-red-400 font-medium mb-2">Please fix the following errors:</h4>
            <ul className="text-red-400 text-sm space-y-1">
              {Object.values(errors).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sets */}
        {selectedTemplate && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {sets.length === 1 ? 'Session Data' : `Sets (${sets.length})`}
              </h2>
              {selectedTemplate.type === 'strength' || selectedTemplate.type === 'plyometrics' ? (
                <button
                  onClick={addSet}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Set
                </button>
              ) : null}
            </div>

            {sets.map((set, index) => (
              <div key={index} className="bg-bg-tertiary rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">
                    {selectedTemplate.type === 'strength' || selectedTemplate.type === 'plyometrics' 
                      ? `Set ${index + 1}` 
                      : 'Session'}
                  </h3>
                  {sets.length > 1 && (
                    <button
                      onClick={() => removeSet(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <TemplateForm
                  template={selectedTemplate}
                  setData={set}
                  onUpdate={(fieldId, value) => handleSetUpdate(index, fieldId, value)}
                  errors={errors}
                  compact={sets.length > 1}
                />
              </div>
            ))}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block w-full rounded-md border-border bg-bg-tertiary text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Any additional notes about this session..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving || !selectedTemplate}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : existingLogId ? 'Update' : 'Save'} {getExerciseTitle()}
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatedExerciseLogger;
