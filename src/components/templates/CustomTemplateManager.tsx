/**
 * CustomTemplateManager Component
 * 
 * Allows users to create, edit, and delete custom workout templates.
 */

import React, { useState, useEffect } from 'react';
import { WorkoutTemplate, TemplateSet, TemplateCategory } from '@/types/workoutTemplate';
import {
  getCustomTemplatesFromStorage,
  createCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate
} from '@/services/workoutTemplateService';
import { XIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/outline';
import { toast } from 'react-hot-toast';

interface CustomTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomTemplateManager: React.FC<CustomTemplateManagerProps> = ({
  isOpen,
  onClose
}) => {
  const [customTemplates, setCustomTemplates] = useState<WorkoutTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCustomTemplates();
    }
  }, [isOpen]);

  const loadCustomTemplates = () => {
    const templates = getCustomTemplatesFromStorage();
    setCustomTemplates(templates);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await deleteCustomTemplate(templateId);
      toast.success('Template deleted');
      loadCustomTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setIsCreating(true);
  };

  const handleEdit = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setIsCreating(true);
  };

  const handleSaveTemplate = () => {
    setIsCreating(false);
    setEditingTemplate(null);
    loadCustomTemplates();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">Manage Custom Templates</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
          >
            <XIcon className="w-6 h-6 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isCreating ? (
            <TemplateEditor
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setIsCreating(false);
                setEditingTemplate(null);
              }}
            />
          ) : (
            <div>
              {/* Create Button */}
              <button
                onClick={handleCreateNew}
                className="w-full p-4 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 mb-4"
              >
                <PlusIcon className="w-5 h-5" />
                Create New Template
              </button>

              {/* Template List */}
              {customTemplates.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <p>No custom templates yet.</p>
                  <p className="text-sm mt-2">Create your first template to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customTemplates.map(template => (
                    <div
                      key={template.id}
                      className="bg-bg-primary rounded-lg p-4 border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-text-primary">{template.name}</h3>
                          <p className="text-sm text-text-secondary mt-1">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-bg-secondary px-2 py-1 rounded text-text-secondary">
                              {template.sets.length} sets
                            </span>
                            {template.category && (
                              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                                {template.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(template)}
                            className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
                            title="Edit template"
                          >
                            <PencilIcon className="w-5 h-5 text-text-secondary" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete template"
                          >
                            <TrashIcon className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isCreating && (
          <div className="p-4 border-t border-border">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-bg-primary text-text-primary rounded-lg hover:bg-bg-hover transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Template Editor Component
interface TemplateEditorProps {
  template: WorkoutTemplate | null;
  onSave: () => void;
  onCancel: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState<TemplateCategory>(template?.category || 'custom');
  const [sets, setSets] = useState<TemplateSet[]>(
    template?.sets || [{ setNumber: 1, reps: 10, rest: 90 }]
  );
  const [saving, setSaving] = useState(false);

  const handleAddSet = () => {
    setSets([...sets, {
      setNumber: sets.length + 1,
      reps: sets[sets.length - 1]?.reps || 10,
      rest: sets[sets.length - 1]?.rest || 90
    }]);
  };

  const handleRemoveSet = (index: number) => {
    const newSets = sets.filter((_, i) => i !== index);
    // Renumber sets
    newSets.forEach((set, i) => {
      set.setNumber = i + 1;
    });
    setSets(newSets);
  };

  const handleUpdateSet = (index: number, updates: Partial<TemplateSet>) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], ...updates };
    setSets(newSets);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (sets.length === 0) {
      toast.error('Please add at least one set');
      return;
    }

    setSaving(true);
    try {
      if (template) {
        await updateCustomTemplate(template.id, { name, description, category, sets });
        toast.success('Template updated');
      } else {
        await createCustomTemplate({ name, description, category, sets });
        toast.success('Template created');
      }
      onSave();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Template Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., My 4×8 Strength"
          className="w-full px-4 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your template..."
          rows={2}
          className="w-full px-4 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as TemplateCategory)}
          className="w-full px-4 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="strength">Strength</option>
          <option value="hypertrophy">Hypertrophy</option>
          <option value="endurance">Endurance</option>
          <option value="power">Power</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Sets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-text-primary">
            Sets *
          </label>
          <button
            onClick={handleAddSet}
            className="text-sm text-accent hover:text-accent-hover flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            Add Set
          </button>
        </div>

        <div className="space-y-2">
          {sets.map((set, index) => (
            <div key={index} className="bg-bg-primary rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">Set {set.setNumber}</span>
                {sets.length > 1 && (
                  <button
                    onClick={() => handleRemoveSet(index)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <TrashIcon className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Reps</label>
                  <input
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) => handleUpdateSet(index, { reps: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-2 py-1 bg-bg-secondary border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1">Rest (sec)</label>
                  <input
                    type="number"
                    value={set.rest || ''}
                    onChange={(e) => handleUpdateSet(index, { rest: parseInt(e.target.value) || undefined })}
                    min="0"
                    className="w-full px-2 py-1 bg-bg-secondary border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1">Weight %</label>
                  <input
                    type="number"
                    value={set.weightPercent || ''}
                    onChange={(e) => handleUpdateSet(index, { weightPercent: parseInt(e.target.value) || undefined })}
                    min="0"
                    max="100"
                    className="w-full px-2 py-1 bg-bg-secondary border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-text-secondary mb-1">RPE</label>
                  <input
                    type="number"
                    value={set.rpe || ''}
                    onChange={(e) => handleUpdateSet(index, { rpe: parseInt(e.target.value) || undefined })}
                    min="1"
                    max="10"
                    className="w-full px-2 py-1 bg-bg-secondary border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-text-secondary mb-1">Notes</label>
                  <input
                    type="text"
                    value={set.notes || ''}
                    onChange={(e) => handleUpdateSet(index, { notes: e.target.value })}
                    placeholder="e.g., To failure, Drop set"
                    className="w-full px-2 py-1 bg-bg-secondary border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-bg-primary text-text-primary rounded-lg hover:bg-bg-hover transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </div>
  );
};

export default CustomTemplateManager;
