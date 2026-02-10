/**
 * TemplateSelector Component
 * 
 * Allows users to select and preview workout templates before applying them.
 * Displays predefined and custom templates with filtering options.
 */

import React, { useState, useEffect } from 'react';
import { WorkoutTemplate, TemplateCategory } from '@/types/workoutTemplate';
import { getAllTemplates } from '@/services/workoutTemplateService';
import { XIcon, SearchIcon } from '@heroicons/react/outline';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkoutTemplate) => void;
  onManageCustomTemplates?: () => void;
  baseWeight?: number; // For displaying percentage-based weights
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onManageCustomTemplates,
  baseWeight
}) => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  // Category colors
  const categoryColors: Record<TemplateCategory | 'all', string> = {
    all: 'bg-gray-600',
    strength: 'bg-red-600',
    hypertrophy: 'bg-blue-600',
    endurance: 'bg-green-600',
    power: 'bg-yellow-600',
    custom: 'bg-purple-600'
  };

  // Load templates
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // Filter templates based on category and search
  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, searchQuery]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const allTemplates = await getAllTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    setSelectedTemplate(template);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  const getCategoryIcon = (category?: TemplateCategory): string => {
    switch (category) {
      case 'strength': return '💪';
      case 'hypertrophy': return '🏋️';
      case 'endurance': return '🏃';
      case 'power': return '⚡';
      case 'custom': return '⭐';
      default: return '📋';
    }
  };

  const formatReps = (reps: number | string): string => {
    return typeof reps === 'string' ? reps : `${reps}`;
  };

  const formatWeight = (weightPercent?: number): string => {
    if (!weightPercent) return '-';
    if (baseWeight) {
      const weight = Math.round((baseWeight * weightPercent) / 100);
      return `${weight}kg (${weightPercent}%)`;
    }
    return `${weightPercent}%`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">Select Workout Template</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
          >
            <XIcon className="w-6 h-6 text-text-secondary" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b border-border space-y-3">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'strength', 'hypertrophy', 'endurance', 'power', 'custom'] as const).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? `${categoryColors[category]} text-white`
                    : 'bg-bg-primary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Template List */}
          <div className="w-1/2 overflow-y-auto p-4 border-r border-border">
            {loading ? (
              <div className="text-center py-8 text-text-secondary">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No templates found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'bg-accent text-white'
                        : 'bg-bg-primary hover:bg-bg-hover text-text-primary'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{template.name}</div>
                        <div className={`text-sm ${
                          selectedTemplate?.id === template.id ? 'text-white/80' : 'text-text-secondary'
                        }`}>
                          {template.sets.length} sets
                          {template.isDefault ? ' • Predefined' : ' • Custom'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Template Preview */}
          <div className="w-1/2 overflow-y-auto p-4">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{getCategoryIcon(selectedTemplate.category)}</span>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        {selectedTemplate.name}
                      </h3>
                      <div className="text-sm text-text-secondary">
                        {selectedTemplate.category && (
                          <span className={`inline-block px-2 py-0.5 rounded text-white text-xs ${
                            categoryColors[selectedTemplate.category]
                          }`}>
                            {selectedTemplate.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-text-secondary">{selectedTemplate.description}</p>
                </div>

                {/* Sets Preview */}
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Sets Structure</h4>
                  <div className="space-y-2">
                    {selectedTemplate.sets.map((set, index) => (
                      <div
                        key={index}
                        className="bg-bg-primary rounded-lg p-3 border border-border"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-text-primary">Set {set.setNumber}</span>
                          {set.notes && (
                            <span className="text-xs text-accent">{set.notes}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-text-secondary">Reps: </span>
                            <span className="text-text-primary font-medium">
                              {formatReps(set.reps || 0)}
                            </span>
                          </div>
                          {set.weightPercent && (
                            <div>
                              <span className="text-text-secondary">Weight: </span>
                              <span className="text-text-primary font-medium">
                                {formatWeight(set.weightPercent)}
                              </span>
                            </div>
                          )}
                          {set.rest && (
                            <div>
                              <span className="text-text-secondary">Rest: </span>
                              <span className="text-text-primary font-medium">{set.rest}s</span>
                            </div>
                          )}
                          {set.rpe && (
                            <div>
                              <span className="text-text-secondary">RPE: </span>
                              <span className="text-text-primary font-medium">{set.rpe}</span>
                            </div>
                          )}
                          {set.rir !== undefined && (
                            <div>
                              <span className="text-text-secondary">RIR: </span>
                              <span className="text-text-primary font-medium">{set.rir}</span>
                            </div>
                          )}
                          {set.duration && (
                            <div>
                              <span className="text-text-secondary">Duration: </span>
                              <span className="text-text-primary font-medium">{set.duration}s</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {baseWeight && (
                  <div className="bg-bg-primary rounded-lg p-3 border border-accent">
                    <div className="text-sm text-text-secondary">
                      Base weight: <span className="text-accent font-medium">{baseWeight}kg</span>
                      <div className="text-xs mt-1">
                        Percentages will be calculated from this weight
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary">
                Select a template to preview
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3">
          {onManageCustomTemplates && (
            <button
              onClick={onManageCustomTemplates}
              className="px-4 py-2 bg-bg-primary text-text-primary rounded-lg hover:bg-bg-hover transition-colors"
            >
              Manage Custom Templates
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bg-primary text-text-primary rounded-lg hover:bg-bg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
