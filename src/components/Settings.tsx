import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { getExportPreview, ExportPreview, downloadWellnessCSV } from '@/services/exportService';
import { downloadPowerBiZip } from '@/services/powerBiExportService';
import { getAllAthletes } from '@/services/coachService';
import { useIsCoach } from '@/hooks/useUserRole';
import type { PowerBiExportScope } from '@/types/powerBiExport';
import { exportFullBackup, downloadBackupJson } from '@/services/backupService';
import { useTheme, Theme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { updateUserRole } from '@/services/firebase/auth';
import { setUser } from '@/features/auth/authSlice';
import toast from 'react-hot-toast';

type DateRangePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'allTime' | 'custom';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  preset: DateRangePreset;
}

const parseLocalDateInput = (value: string, endOfDay = false): Date | null => {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;

  if (endOfDay) {
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const getDateRangeFromPreset = (preset: DateRangePreset): { startDate: Date | null; endDate: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
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
  const dispatch = useDispatch();
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingWellness, setIsExportingWellness] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
    preset: 'allTime'
  });
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [exportScope, setExportScope] = useState<PowerBiExportScope>('self');
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [athletes, setAthletes] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(false);
  const [isPowerBiExporting, setIsPowerBiExporting] = useState(false);
  const isCoach = useIsCoach();

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
    const date = parseLocalDateInput(value, field === 'endDate');

    setDateRange(prev => ({
      ...prev,
      [field]: date,
      preset: 'custom'
    }));
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load athletes for the athlete-scope dropdown (coaches only)
  useEffect(() => {
    if (!isCoach || exportScope !== 'athlete') return;
    setIsLoadingAthletes(true);
    getAllAthletes()
      .then((data) => {
        const mapped = data.map((a) => ({
          id: a.id,
          name:
            [a.firstName, a.lastName].filter(Boolean).join(' ') || a.email || a.id,
        }));
        setAthletes(mapped);
        if (mapped.length > 0 && !selectedAthleteId) {
          setSelectedAthleteId(mapped[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load athletes:', err);
        toast.error('Could not load athlete list');
      })
      .finally(() => setIsLoadingAthletes(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoach, exportScope]);

  const handleExportPowerBi = async () => {
    if (!user?.id) {
      toast.error('Please log in to export your data.');
      return;
    }
    if (exportScope === 'athlete' && !selectedAthleteId) {
      toast.error('Please select an athlete to export.');
      return;
    }
    setIsPowerBiExporting(true);
    try {
      const d = dateRange.startDate;
      const fromDate = d
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : undefined;

      const result = await downloadPowerBiZip(
        {
          scope: exportScope,
          targetAthleteId: exportScope === 'athlete' ? selectedAthleteId : undefined,
          fromDate,
        },
        {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role,
        }
      );
      toast.success(
        `Export ready! ${result.gymSetCount} gym sets · ${result.activityCount} activity rows · ${result.athleteCount} athlete(s)`
      );
    } catch (error) {
      console.error('Power BI export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Export failed: ${errorMessage}`);
    } finally {
      setIsPowerBiExporting(false);
    }
  };

  const handleExportWellness = async () => {
    if (!user?.id) {
      toast.error('Please log in to export your data.');
      return;
    }
    setIsExportingWellness(true);
    try {
      const count = await downloadWellnessCSV(
        user.id,
        dateRange.startDate ?? undefined,
        dateRange.endDate ?? undefined
      );
      if (count === 0) {
        toast('No wellness data found for the selected range.');
      } else {
        toast.success(`Exported ${count} wellness entr${count === 1 ? 'y' : 'ies'} to wellness_logs.csv`);
      }
    } catch (error) {
      console.error('Wellness export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Wellness export failed: ${errorMessage}`);
    } finally {
      setIsExportingWellness(false);
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

  const { theme, setTheme } = useTheme();
  const { settings: appSettings, updateSetting } = useSettings();

  const [settings, setSettings] = useState<Setting[]>([
    {
      id: 'defaultIncrements',
      label: 'Default Weight Increments',
      type: 'select',
      value: appSettings.defaultWeightIncrements,
      options: [
        { label: '1.0 kg', value: 1.0 },
        { label: '2.5 kg', value: 2.5 },
        { label: '5.0 kg', value: 5.0 }
      ]
    }
  ]);

  // Sync local state with context when appSettings change
  useEffect(() => {
    setSettings(prev => prev.map(setting => {
      if (setting.id === 'defaultIncrements') {
        return { ...setting, value: appSettings.defaultWeightIncrements };
      }
      return setting;
    }));
  }, [appSettings.defaultWeightIncrements]);

  const handleSettingChange = (id: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, value } : setting
    ));
    
    // Update the context as well
    if (id === 'defaultIncrements') {
      updateSetting('defaultWeightIncrements', value);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleRoleChange = async (newRole: 'athlete' | 'coach') => {
    if (!user?.id || isUpdatingRole) return;
    
    if (user.role === newRole) return; // No change needed

    setIsUpdatingRole(true);
    try {
      await updateUserRole(user.id, newRole);
      
      // Update Redux state
      dispatch(setUser({
        ...user,
        role: newRole,
        updatedAt: new Date()
      }));
      
      toast.success(`Role updated to ${newRole}`);
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-xl w-full max-w-2xl h-[90vh] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors text-text-secondary hover:text-text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Settings List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Theme Setting */}
              <div className="flex items-center justify-between">
                <span className="text-text-primary">Theme</span>
                <select
                  value={theme}
                  onChange={(e) => handleThemeChange(e.target.value as Theme)}
                  className="bg-bg-tertiary text-text-primary px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary cursor-pointer"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              {/* User Role Setting */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-text-primary font-medium">Role</div>
                  <p className="text-text-tertiary text-sm mt-1">
                    Choose your role to access relevant features
                  </p>
                </div>
                <select
                  value={user?.role || 'athlete'}
                  onChange={(e) => handleRoleChange(e.target.value as 'athlete' | 'coach')}
                  disabled={isUpdatingRole}
                  className="bg-bg-tertiary text-text-primary px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach</option>
                </select>
              </div>

              {/* Progressive Overload Auto-fill Toggle */}
              <div className="flex items-start justify-between py-2">
                <div className="flex-1 pr-4">
                  <div className="text-text-primary font-medium">Progressive Overload Auto-fill</div>
                  <p className="text-text-tertiary text-sm mt-1">
                    Automatically pre-fill resistance exercises with smart weight, rep, and RPE suggestions based on your previous session
                  </p>
                </div>
                <button
                  onClick={() => updateSetting('useProgressiveOverload', !appSettings.useProgressiveOverload)}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    appSettings.useProgressiveOverload ? 'bg-accent-primary' : 'bg-bg-tertiary'
                  }`}
                  aria-label="Toggle progressive overload auto-fill"
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transform transition-transform ${
                      appSettings.useProgressiveOverload ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
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

                {/* Export scope selector — visible to coaches only */}
                {isCoach && (
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Export scope</label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { key: 'self' as PowerBiExportScope, label: 'My data only' },
                        { key: 'athlete' as PowerBiExportScope, label: 'Specific athlete' },
                        { key: 'team' as PowerBiExportScope, label: 'Full team' },
                      ] as const).map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setExportScope(key)}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            exportScope === key
                              ? 'bg-accent-primary text-white'
                              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Athlete selector — only when scope === 'athlete' */}
                {isCoach && exportScope === 'athlete' && (
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Select athlete</label>
                    {isLoadingAthletes ? (
                      <p className="text-sm text-text-secondary">Loading athletes...</p>
                    ) : athletes.length === 0 ? (
                      <p className="text-sm text-text-secondary">No athletes found. Make sure athletes have joined your team.</p>
                    ) : (
                      <select
                        value={selectedAthleteId}
                        onChange={(e) => setSelectedAthleteId(e.target.value)}
                        className="w-full bg-bg-tertiary text-text-primary px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      >
                        {athletes.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Date Range — "Export since" for incremental Power BI refreshes */}
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Date range (optional — leave blank for all data)</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'last7days' as DateRangePreset, label: 'Last 7 days' },
                      { key: 'last30days' as DateRangePreset, label: 'Last 30 days' },
                      { key: 'thisMonth' as DateRangePreset, label: 'This month' },
                      { key: 'lastMonth' as DateRangePreset, label: 'Last month' },
                      { key: 'allTime' as DateRangePreset, label: 'All time' },
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">From date</label>
                      <input
                        type="date"
                        value={formatDateForInput(dateRange.startDate)}
                        onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                        className="w-full bg-bg-tertiary text-text-primary px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">To date</label>
                      <input
                        type="date"
                        value={formatDateForInput(dateRange.endDate)}
                        onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                        className="w-full bg-bg-tertiary text-text-primary px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Data preview (own data only) */}
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
                        {' in selected range (your data)'}
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary">No data in selected range</p>
                    )}
                  </div>
                )}

                {/* Power BI Export Button */}
                <button
                  onClick={handleExportPowerBi}
                  disabled={
                    isPowerBiExporting ||
                    !user?.id ||
                    (exportScope === 'athlete' && !selectedAthleteId)
                  }
                  className="w-full bg-accent-primary text-white py-3 px-4 rounded-md hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isPowerBiExporting
                    ? 'Exporting…'
                    : !user?.id
                    ? 'Login Required'
                    : 'Export for Power BI (ZIP)'}
                </button>
                <p className="text-sm text-text-secondary">
                  Downloads a ZIP with fact_gym_sets.csv, fact_activity.csv, dim_exercise.csv, dim_athlete.csv and export_meta.json — ready to connect to Power BI.
                </p>

                {/* JSON Backup Export */}
                <div className="pt-4 border-t border-border space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary mb-1">Wellness Log (CSV)</h4>
                    <p className="text-xs text-text-secondary">
                      Export your daily wellness check-ins (sleep quality, fatigue, muscle soreness, stress, mood) as a CSV for the selected date range.
                    </p>
                  </div>
                  <button
                    onClick={handleExportWellness}
                    disabled={isExportingWellness || !user?.id}
                    className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isExportingWellness ? 'Exporting…' : !user?.id ? 'Login Required' : 'Export Wellness (CSV)'}
                  </button>
                </div>

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
  );
};

export default Settings;
