import React from 'react';
// import { Exercise, SessionTemplate } from '@/services/sessionTemplateService';


// Remove all code that references Exercise and SessionTemplate, as the session template feature is removed.

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, exercises: any[]) => void;
  template?: any;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose }) => {
  // This modal is now disabled.
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#23272F] p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Session Template Feature Removed</h2>
        <p className="mb-4">The session template feature has been removed from this app version.</p>
        <button className="px-4 py-2 bg-gray-700 text-white rounded-lg" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default TemplateModal;
