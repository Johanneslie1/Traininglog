import React, { useState } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Setting {
  id: string;
  label: string;
  type: 'switch' | 'select';
  value: any;
  options?: { label: string; value: any; }[];
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [settings] = useState<Setting[]>([
    {
      id: 'darkMode',
      label: 'Dark Mode',
      type: 'switch',
      value: true
    },
    {
      id: 'defaultIncrements',
      label: 'Default Weight Increments',
      type: 'select',
      value: 2.5,
      options: [
        { label: '1.0 kg', value: 1.0 },
        { label: '2.5 kg', value: 2.5 },
        { label: '5.0 kg', value: 5.0 }
      ]
    }
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-bg-primary animate-slide-in-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text-primary">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-bg-secondary rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Settings List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <span className="text-text-primary">{setting.label}</span>
                  {setting.type === 'switch' ? (
                    <button
                      className={`w-12 h-6 rounded-full transition-colors ${
                        setting.value ? 'bg-accent-primary' : 'bg-bg-tertiary'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                          setting.value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  ) : setting.type === 'select' ? (
                    <select
                      value={setting.value}
                      className="bg-bg-tertiary text-text-primary px-3 py-1 rounded-md"
                    >
                      {setting.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-sm text-text-secondary text-center">
              App Version 1.0.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
