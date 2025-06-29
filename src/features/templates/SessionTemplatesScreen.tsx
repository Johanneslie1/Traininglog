import React, { useEffect, useState } from 'react';
import {
  getSessionTemplates,
  deleteSessionTemplate,
  createSessionTemplate,
  editSessionTemplate,
  SessionTemplate,
  type Exercise,
} from '@/services/sessionTemplateService';
import TemplateModal from './TemplateModal';

const SessionTemplatesScreen: React.FC = () => {
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SessionTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const data = await getSessionTemplates();
    setTemplates(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    setDeletingId(id);
    await deleteSessionTemplate(id);
    await fetchTemplates();
    setDeletingId(null);
  };

  const handleCreateTemplate = async (name: string, exercises: Exercise[]) => {
    setShowModal(false);
    await createSessionTemplate(name, exercises);
    await fetchTemplates();
  };

  const handleEditTemplate = async (name: string, exercises: Exercise[]) => {
    if (!editingTemplate) return;
    setShowModal(false);
    await editSessionTemplate(editingTemplate.id, { name, exercises });
    setEditingTemplate(null);
    await fetchTemplates();
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const openEditModal = (template: SessionTemplate) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#181A20] text-white">
      <header className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#1a1a1a] z-10">
        <h1 className="text-2xl font-bold">Session Templates</h1>
        <button
          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-500 transition-colors font-medium"
          onClick={openCreateModal}
        >
          + Create New Template
        </button>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-gray-400 mt-20">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">No templates found.</div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {templates.map((template) => (
              <div key={template.id} className="bg-[#23272F] rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-white/10">
                <div>
                  <div className="font-semibold text-lg mb-1">{template.name}</div>
                  <div className="text-gray-400 text-sm">
                    {template.exercises.slice(0, 3).map(e => e.name).join(', ')}
                    {template.exercises.length > 3 && `, +${template.exercises.length - 3} more`}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 md:mt-0">
                  <button
                    className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-500 text-white text-sm"
                    onClick={() => openEditModal(template)}
                  >Edit</button>
                  <button
                    className="px-3 py-1 bg-green-600 rounded-lg hover:bg-green-500 text-white text-sm"
                    onClick={() => openEditModal(template)}
                  >Add Exercises</button>
                  <button
                    className="px-3 py-1 bg-red-600 rounded-lg hover:bg-red-500 text-white text-sm"
                    onClick={() => handleDelete(template.id)}
                    disabled={deletingId === template.id}
                  >
                    {deletingId === template.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <TemplateModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingTemplate(null); }}
        onSave={editingTemplate ? handleEditTemplate : handleCreateTemplate}
        template={editingTemplate || undefined}
      />
    </div>
  );
};

export default SessionTemplatesScreen;
