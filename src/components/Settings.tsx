import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { exportData, downloadCSV, downloadActivityCSVs, getExportPreview, ExportPreview, ExportOptions } from '@/services/exportService';
import { exportFullBackup, downloadBackupJson } from '@/services/backupService';

type DateRangePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'allTime' | 'custom';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  preset: DateRangePreset;
}

const getDateRangeFromPreset = (preset: DateRangePreset): { startDate: Date | null; endDate: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  switch (preset) {
    case 'last7days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: today };
    }
    case 'last30days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: today };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: today };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { startDate: start, endDate: end };
    }
    case 'allTime':
    default:
      return { startDate: null, endDate: null };
  }
};

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
  const { user } = useSelector((state: RootState) => state.auth);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [separateByActivityType, setSeparateByActivityType] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
    preset: 'allTime'
  });
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Fetch export preview when date range changes
  const fetchPreview = useCallback(async () => {
    if (!user?.id || !isOpen) return;
    
    setIsLoadingPreview(true);
    try {
      const preview = await getExportPreview(
        user.id,
        dateRange.startDate || undefined,
        dateRange.endDate || undefined
      );
      setExportPreview(preview);
    } catch (error) {
      console.error('Failed to get export preview:', error);
      setExportPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [user?.id, dateRange.startDate, dateRange.endDate, isOpen]);

  // Fetch preview when modal opens or date range changes
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchPreview();
    }
  }, [isOpen, user?.id, dateRange.startDate?.getTime(), dateRange.endDate?.getTime()]); // Use getTime() to avoid object reference issues

  const handlePresetChange = (preset: DateRangePreset) => {
    const { startDate, endDate } = getDateRangeFromPreset(preset);
    setDateRange({ startDate, endDate, preset });
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const date = value ? new Date(value) : null;
    if (field === 'endDate' && date) {
      date.setHours(23, 59, 59, 999);
    }
    setDateRange(prev => ({
      ...prev,
      [field]: date,
      preset: 'custom'
    }));
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleExport = async () => {
    if (!user?.id) {
      alert('Please log in to export your data.');
      return;
    }
    
    setIsExporting(true);
    try {
      const exportOptions: ExportOptions = {
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        separateByActivityType
      };
      
      if (separateByActivityType) {
        // Use the new activity-specific export
        const fileCount = await downloadActivityCSVs(user.id, exportOptions);
        alert(`Export completed! Downloaded ${fileCount} activity-specific CSV file(s).\nCheck your downloads folder.`);
      } else {
        // Use the original all-in-one export
        const data = await exportData(user.id, exportOptions);
        
        if (data.sessions.length > 0) {
          downloadCSV(
            data.sessions,
            ['userId', 'sessionId', 'sessionDate', 'startTime', 'endTime', 'notes', 'totalVolume', 'sessionRPE', 'exerciseCount', 'setCount', 'durationMinutes', 'createdAt', 'updatedAt'],
            'sessions.csv'
          );
        }
        
        if (data.exerciseLogs.length > 0) {
          downloadCSV(
            data.exerciseLogs,
            ['userId', 'sessionId', 'exerciseLogId', 'exerciseId', 'exerciseName', 'category', 'type', 'setCount', 'totalReps', 'maxWeight', 'totalVolume', 'averageRPE', 'notes', 'createdAt'],
            'exercise_logs.csv'
          );
        }
        
        if (data.sets.length > 0) {
          downloadCSV(
            data.sets,
            ['userId', 'sessionId', 'exerciseLogId', 'exerciseName', 'exerciseType', 'activityType', 'loggedDate', 'loggedTimestamp', 'setNumber', 'reps', 'weight', 'durationSec', 'distanceMeters', 'rpe', 'rir', 'restTimeSec', 'isWarmup', 'setVolume', 'comment', 'notes', 'hrZone1', 'hrZone2', 'hrZone3', 'hrZone4', 'hrZone5', 'averageHR', 'maxHR', 'heartRate', 'calories', 'height', 'explosivePower', 'reactivePower', 'time', 'performance', 'stretchType', 'intensity', 'bodyPart', 'holdTime', 'flexibility', 'pace', 'elevation'],
            'exercise_sets.csv'
          );
        }
        
        const exportedFiles = [];
        if (data.sessions.length > 0) exportedFiles.push('sessions.csv');
        if (data.exerciseLogs.length > 0) exportedFiles.push('exercise_logs.csv');
        if (data.sets.length > 0) exportedFiles.push('exercise_sets.csv');
        
        if (exportedFiles.length > 0) {
          alert(`Export completed! Downloaded: ${exportedFiles.join(', ')}\nCheck your downloads folder.`);
        } else {
          alert('No data found to export. Try logging some workouts first.');
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = async () => {
    if (!user?.id) {
      alert('Please log in to export your data.');
      return;
    }

    setIsExportingJson(true);
    try {
      const backupData = await exportFullBackup(user.id);
      downloadBackupJson(backupData);

      const exerciseCount = backupData.exercises.length;
      const programCount = backupData.programs.length;
      const totalSets = backupData.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

      alert(
        `JSON Backup completed!\n\n` +
        `Exported:\n` +
        `• ${exerciseCount} exercise logs (${totalSets} total sets)\n` +
        `• ${programCount} programs\n` +
        `• App settings\n\n` +
        `Check your downloads folder.`
      );
    } catch (error) {
      console.error('JSON export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`JSON export failed: ${errorMessage}`);
    } finally {
      setIsExportingJson(false);
    }
  };

  const [settings, setSettings] = useState<Setting[]>([
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

  const handleSettingChange = (id: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, value } : setting
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
      <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-bg-primary animate-slide-in-right z-[60]">
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
                      onChange={(e) => handleSettingChange(setting.id, parseFloat(e.target.value))}
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
              
              {/* Export Data Section */}
              <div className="pt-4 border-t border-border space-y-4">
                <h3 className="text-lg font-medium text-text-primary">Export Data</h3>
                
                {/* Date Range Preset Buttons */}
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Date Range</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'last7days' as DateRangePreset, label: 'Last 7 days' },
                      { key: 'last30days' as DateRangePreset, label: 'Last 30 days' },
                      { key: 'thisMonth' as DateRangePreset, label: 'This month' },
                      { key: 'lastMonth' as DateRangePreset, label: 'Last month' },
                      { key: 'allTime' as DateRangePreset, label: 'All time' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handlePresetChange(key)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          dateRange.preset === key
                            ? 'bg-accent-primary text-white'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formatDateForInput(dateRange.startDate)}
                      onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                      className="w-full bg-bg-tertiary text-text-primary px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">End Date</label>
                    <input
                      type="date"
                      value={formatDateForInput(dateRange.endDate)}
                      onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                      className="w-full bg-bg-tertiary text-text-primary px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                  </div>
                </div>

                {/* Export Preview */}
                {user?.id && (
                  <div className="bg-bg-secondary rounded-md p-3">
                    {isLoadingPreview ? (
                      <p className="text-sm text-text-secondary">Loading preview...</p>
                    ) : exportPreview ? (
                      <div className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">
                          {exportPreview.sessionCount} sessions
                        </span>
                        {', '}
                        <span className="font-medium text-text-primary">
                          {exportPreview.exerciseCount} exercises
                        </span>
                        {', '}
                        <span className="font-medium text-text-primary">
                          {exportPreview.setCount} sets
                        </span>
                        {' in selected range'}
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary">No data in selected range</p>
                    )}
                  </div>
                )}

                {/* Export Format Toggle */}
                <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-md">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Export separate files per activity type</label>
                    <p className="text-xs text-text-secondary mt-1">
                      Creates focused CSV files with only relevant columns for each activity
                    </p>
                  </div>
                  <button
                    onClick={() => setSeparateByActivityType(!separateByActivityType)}
                    className={`ml-4 w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                      separateByActivityType ? 'bg-accent-primary' : 'bg-bg-tertiary'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                        separateByActivityType ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isExporting || !user?.id || (exportPreview !== null && exportPreview.sessionCount === 0 && exportPreview.exerciseCount === 0)}
                  className="w-full bg-accent-primary text-white py-3 px-4 rounded-md hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isExporting ? 'Exporting...' : !user?.id ? 'Login Required' : 'Export as CSV'}
                </button>
                <p className="text-sm text-text-secondary">
                  {!user?.id 
                    ? 'Please log in to export your training data.'
                    : separateByActivityType
                    ? 'Download activity-specific CSV files (resistance, endurance, speed/agility, stretching, sport) with only relevant columns for each type.'
                    : 'Download your training data as CSV files for analysis in Excel, Google Sheets, or other tools.'
                  }
                </p>

                {/* JSON Backup Export */}
                <div className="pt-4 border-t border-border space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary mb-1">Complete Backup (JSON)</h4>
                    <p className="text-xs text-text-secondary">
                      Export all your data including exercises, programs, and settings in JSON format for complete backup and future restore capability.
                    </p>
                  </div>
                  <button
                    onClick={handleExportJson}
                    disabled={isExportingJson || !user?.id}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isExportingJson ? 'Exporting JSON...' : !user?.id ? 'Login Required' : 'Export as JSON'}
                  </button>
                </div>
              </div>
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
