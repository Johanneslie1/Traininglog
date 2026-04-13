import React, { createContext, useContext, useState, useEffect } from 'react';
import { getExerciseLogs, saveAllExerciseLogs } from '@/utils/localStorageUtils';
import { convertExerciseLogsUnits, convertTemplates } from '@/utils/exerciseConversion';

export interface AppSettings {
  defaultWeightIncrements: number;
  defaultUnits: 'kg' | 'lb';
  useProgressiveOverload: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  defaultWeightIncrements: 2.5,
  defaultUnits: 'kg',
  useProgressiveOverload: true, // Enable by default for better UX
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Auto-adjust weight increments and convert existing data when units change
      if (key === 'defaultUnits') {
        const newUnits = value as 'kg' | 'lb';
        const oldUnits = prev.defaultUnits;
        
        if (newUnits !== oldUnits) {
          // Convert all existing exercise data
          try {
            const existingLogs = getExerciseLogs();
            console.log(`🔄 Converting ${existingLogs.length} exercise logs from ${oldUnits} to ${newUnits}`);
            
            const convertedLogs = convertExerciseLogsUnits(existingLogs, oldUnits, newUnits);
            saveAllExerciseLogs(convertedLogs);
            
            console.log(`✅ Successfully converted all exercise weights from ${oldUnits} to ${newUnits}`);
          } catch (error) {
            console.error('❌ Error converting exercise weights:', error);
          }

          // Convert all existing templates
          try {
            const savedTemplates = localStorage.getItem('program-templates');
            if (savedTemplates) {
              const templates = JSON.parse(savedTemplates);
              console.log(`🔄 Converting ${templates.length} templates from ${oldUnits} to ${newUnits}`);
              
              const convertedTemplates = convertTemplates(templates, oldUnits, newUnits);
              localStorage.setItem('program-templates', JSON.stringify(convertedTemplates));
              
              console.log(`✅ Successfully converted all template weights from ${oldUnits} to ${newUnits}`);
            }
          } catch (error) {
            console.error('❌ Error converting template weights:', error);
          }
        }
        
        // Auto-adjust weight increments
        if (newUnits === 'kg') {
          // Convert to kg increments
          if (prev.defaultWeightIncrements === 2.5) newSettings.defaultWeightIncrements = 2.5;
          else if (prev.defaultWeightIncrements === 5) newSettings.defaultWeightIncrements = 5;
          else if (prev.defaultWeightIncrements === 10) newSettings.defaultWeightIncrements = 2.5; // Default to 2.5kg
          else newSettings.defaultWeightIncrements = 2.5;
        } else {
          // Convert to lb increments  
          if (prev.defaultWeightIncrements === 2.5) newSettings.defaultWeightIncrements = 5;
          else if (prev.defaultWeightIncrements === 5) newSettings.defaultWeightIncrements = 10;
          else if (prev.defaultWeightIncrements === 1) newSettings.defaultWeightIncrements = 2.5; // 1kg -> 2.5lb
          else newSettings.defaultWeightIncrements = 5; // Default to 5lb
        }
      }
      
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('appSettings');
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
