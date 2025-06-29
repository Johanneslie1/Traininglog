import React, { useState, useEffect } from 'react';
import { getSessionTemplates } from '@/services/sessionTemplateService';

// Types
export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
};
export type SessionTemplate = {
  id: string;
  name: string;
  exercises: Exercise[];
};

interface ImportFromTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onExercisesSelected: (exercises: Exercise[]) => void;
}

const ImportFromTemplateDialog: React.FC<ImportFromTemplateDialogProps> = ({
  isOpen,
  onClose,
  onExercisesSelected,
}) => {
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(null);
      setSelectedExercises(new Set());
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    const data = await getSessionTemplates();
    setTemplates(data);
    setLoading(false);
  };

  const handleTemplateSelect = (template: SessionTemplate) => {
    setSelectedTemplate(template);
    setSelectedExercises(new Set(template.exercises.map(e => e.id)));
  };

  const handleToggleExercise = (id: string) => {
    setSelectedExercises(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!selectedTemplate) return;
    setSelectedExercises(new Set(selectedTemplate.exercises.map(e => e.id)));
  };
  const handleDeselectAll = () => setSelectedExercises(new Set());

  const handleImport = () => {
    if (!selectedTemplate) return;
    const selected = selectedTemplate.exercises.filter(e => selectedExercises.has(e.id));
    onExercisesSelected(selected);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 md:p-0">
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-4xl h-[90vh] md:h-[80vh] flex flex-col text-white border border-white/10 relative">
        <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-[#1a1a1a] z-10">
          <h2 className="text-2xl font-medium">Import from Session Template</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center text-gray-400 mt-20">Loading templates...</div>
          ) : !selectedTemplate ? (
            <div className="max-w-xl mx-auto">
              <div className="mb-6 text-lg font-medium text-white">Select a Template</div>
              <div className="space-y-3">
                {templates.length === 0 && <div className="text-gray-400">No templates found.</div>}
                {templates.map(tpl => (
                  <button
                    key={tpl.id}
                    className="w-full text-left p-4 bg-[#23272F] rounded-xl hover:bg-[#2a2a2a] border border-white/10 transition-colors"
                    onClick={() => handleTemplateSelect(tpl)}
                  >
                    <div className="font-semibold text-lg mb-1">{tpl.name}</div>
                    <div className="text-gray-400 text-sm">
                      {tpl.exercises.slice(0, 3).map(e => e.name).join(', ')}
                      {tpl.exercises.length > 3 && `, +${tpl.exercises.length - 3} more`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-medium text-white">{selectedTemplate.name}</div>
                <div className="flex gap-2">
                  <button className="text-sm text-purple-400 hover:underline" onClick={handleSelectAll}>Select All</button>
                  <button className="text-sm text-gray-400 hover:underline" onClick={handleDeselectAll}>Deselect All</button>
                  <button className="text-sm text-gray-400 hover:underline" onClick={() => setSelectedTemplate(null)}>Back</button>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                {selectedTemplate.exercises.length === 0 && <div className="text-gray-400">No exercises in this template.</div>}
                {selectedTemplate.exercises.map(ex => (
                  <label key={ex.id} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedExercises.has(ex.id) ? 'bg-purple-500/20 border border-purple-500/50' : 'hover:bg-white/5 border border-transparent'}`}>
                    <input
                      type="checkbox"
                      className="form-checkbox rounded border-white/10 bg-[#2a2a2a] text-purple-500 focus:ring-purple-500"
                      checked={selectedExercises.has(ex.id)}
                      onChange={() => handleToggleExercise(ex.id)}
                    />
                    <span className="ml-3">{ex.name} <span className="text-gray-400 text-xs ml-2">{ex.sets}×{ex.reps} @ {ex.weight}kg</span></span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3 sticky bottom-0 bg-[#1a1a1a] py-4">
                <button
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleImport}
                  disabled={selectedExercises.size === 0}
                >
                  Add Selected
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportFromTemplateDialog;
