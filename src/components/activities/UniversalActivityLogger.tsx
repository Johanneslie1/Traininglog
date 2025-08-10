import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { TrainingTemplate, TemplateField, UniversalExerciseSet } from '@/types/trainingTemplates';
import { activityLoggingService } from '@/services/activityService';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';

interface UniversalActivityLoggerProps {
  template: TrainingTemplate;
  activityName: string;
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null; // Add editing exercise prop
}

const UniversalActivityLogger: React.FC<UniversalActivityLoggerProps> = ({
  template,
  activityName,
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date(),
  editingExercise = null
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [sessions, setSessions] = useState<UniversalExerciseSet[]>([]);
  const [currentSession, setCurrentSession] = useState<UniversalExerciseSet>({});
  const [loading, setLoading] = useState(false);

  // Initialize current session with default values and editing data
  React.useEffect(() => {
    if (editingExercise && editingExercise.sets && editingExercise.sets.length > 0) {
      // If editing, populate with existing data
      console.log('🎯 UniversalActivityLogger: Editing exercise data:', editingExercise);
      
      const existingSessions = editingExercise.sets.map((set: any, index: number) => {
        const session = {
          ...set,
          setNumber: set.setNumber || index + 1
        };
        
        // For endurance activities, handle field name mapping
        if (template.type === 'endurance') {
          // Map the field names to match the template
          session.averageHR = session.averageHeartRate || session.averageHR;
          session.maxHR = session.maxHeartRate || session.maxHR;
        }
        
        console.log('🎯 Mapped session for editing:', session);
        return session;
      });
      
      setSessions(existingSessions);
      console.log('🎯 Set existing sessions for editing:', existingSessions);
    }
    
    // Initialize current session with default values based on template
    const initialSession: UniversalExerciseSet = {};
    template.fields.forEach(field => {
      switch (field.type) {
        case 'number':
        case 'duration':
        case 'distance':
        case 'intensity':
        case 'heartRate':
        case 'rpe':
          initialSession[field.fieldId] = field.min || 0;
          break;
        case 'boolean':
          initialSession[field.fieldId] = false;
          break;
        case 'select':
          initialSession[field.fieldId] = field.options?.[0] || '';
          break;
        default:
          initialSession[field.fieldId] = '';
      }
    });
    setCurrentSession(initialSession);
  }, [template, editingExercise]);

  const handleAddSession = () => {
    if (Object.keys(currentSession).length === 0) return;
    setSessions(prev => [...prev, { ...currentSession, setNumber: prev.length + 1 }]);
    
    // Reset current session
    const resetSession: UniversalExerciseSet = {};
    template.fields.forEach(field => {
      switch (field.type) {
        case 'number':
        case 'duration':
        case 'distance':
        case 'intensity':
        case 'heartRate':
        case 'rpe':
          resetSession[field.fieldId] = field.min || 0;
          break;
        case 'boolean':
          resetSession[field.fieldId] = false;
          break;
        case 'select':
          resetSession[field.fieldId] = field.options?.[0] || '';
          break;
        default:
          resetSession[field.fieldId] = '';
      }
    });
    setCurrentSession(resetSession);
  };

  const handleRemoveSession = (index: number) => {
    setSessions(prev => prev.filter((_, i) => i !== index).map((session, i) => ({
      ...session,
      setNumber: i + 1
    })));
  };

  const handleSaveActivity = async () => {
    if (!user?.id || sessions.length === 0) return;

    setLoading(true);
    try {      
      console.log('🎯 UniversalActivityLogger: Saving activity', {
        activityType: template.type,
        activityName,
        sessions,
        sessionCount: sessions.length
      });

      // Use the appropriate logging service based on activity type
      if (template.type === 'teamSports') {
        await activityLoggingService.logSportActivity(
          template.id,
          activityName,
          sessions,
          user.id,
          selectedDate
        );
      } else if (template.type === 'endurance') {
        // For endurance, map the field names correctly
        const mappedSessions = sessions.map(session => ({
          ...session,
          // Map averageHR to averageHeartRate for consistency with logging service
          averageHeartRate: session.averageHR || session.averageHeartRate,
          maxHeartRate: session.maxHR || session.maxHeartRate,
          // Ensure all fields are included
          rpe: session.rpe,
          hrZone1: session.hrZone1,
          hrZone2: session.hrZone2,
          hrZone3: session.hrZone3
        }));
        
        console.log('🏃 Mapped endurance sessions:', mappedSessions);
        
        await activityLoggingService.logEnduranceExercise(
          template.id,
          activityName,
          mappedSessions,
          user.id,
          selectedDate
        );
      } else if (template.type === 'flexibility') {
        await activityLoggingService.logStretchingExercise(
          template.id,
          activityName,
          sessions,
          user.id,
          selectedDate
        );
      } else if (template.type === 'speedAgility') {
        console.log('⚡ Logging speed & agility exercise with sessions:', sessions);
        
        await activityLoggingService.logSpeedAgilityExercise(
          template.id,
          activityName,
          sessions,
          user.id,
          selectedDate
        );
      } else if (template.type === 'other') {
        await activityLoggingService.logOtherActivity(
          template.id,
          activityName,
          sessions,
          user.id,
          selectedDate
        );
      }
      onActivityLogged();
    } catch (error) {
      console.error('Error saving activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: TemplateField) => {
    const value = currentSession[field.fieldId] || '';

    switch (field.type) {
      case 'duration':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setCurrentSession(prev => ({ 
                ...prev, 
                [field.fieldId]: Number(e.target.value) 
              }))}
              className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              min={field.min}
              max={field.max}
              step={field.step}
              placeholder={field.placeholder}
              required={field.required}
            />
            {field.unit && <span className="text-sm text-gray-400 mt-1 block">{field.unit}</span>}
          </div>
        );

      case 'distance':
      case 'number':
      case 'heartRate':
      case 'rpe':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setCurrentSession(prev => ({ 
                ...prev, 
                [field.fieldId]: Number(e.target.value) 
              }))}
              className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              min={field.min}
              max={field.max}
              step={field.step}
              placeholder={field.placeholder}
              required={field.required}
            />
            {field.unit && <span className="text-sm text-gray-400 mt-1 block">{field.unit}</span>}
          </div>
        );

      case 'intensity':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input
              type="range"
              min={field.min || 1}
              max={field.max || 10}
              step={field.step || 0.5}
              value={value}
              onChange={(e) => setCurrentSession(prev => ({ 
                ...prev, 
                [field.fieldId]: Number(e.target.value) 
              }))}
              className="w-full"
            />
            <div className="text-center text-white mt-1">{value}/{field.max || 10}</div>
          </div>
        );

      case 'select':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => setCurrentSession(prev => ({ 
                ...prev, 
                [field.fieldId]: e.target.value 
              }))}
              className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required={field.required}
            >
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );

      case 'string':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => setCurrentSession(prev => ({ 
                ...prev, 
                [field.fieldId]: e.target.value 
              }))}
              className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setCurrentSession(prev => ({ 
                ...prev, 
                [field.fieldId]: e.target.checked 
              }))}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-300">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{activityName}</h2>
              <p className="text-gray-400">{template.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Change Activity
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Log Session #{sessions.length + 1}</h3>
            
            <div className="space-y-4">
              {template.fields.map(field => (
                <div key={field.fieldId}>
                  {renderField(field)}
                </div>
              ))}
            </div>

            <button
              onClick={handleAddSession}
              disabled={!currentSession.duration || (template.fields.some(f => f.required && !currentSession[f.fieldId]))}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Add Session
            </button>
          </div>

          {/* Sessions List */}
          {sessions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-white mb-3">Logged Sessions ({sessions.length})</h4>
              <div className="space-y-2">
                {sessions.map((session, index) => (
                  <div key={index} className="p-3 bg-[#2a2a2a] rounded-lg flex justify-between items-center">
                    <div className="text-white">
                      <span className="font-medium">Session {session.setNumber}: </span>
                      {session.duration}min
                      {session.distance && ` • ${session.distance}m`}
                      {session.calories && ` • ${session.calories} kcal`}
                      {session.heartRate && ` • ${session.heartRate} bpm`}
                      {session.intensity && ` • Intensity: ${session.intensity}/10`}
                    </div>
                    <button
                      onClick={() => handleRemoveSession(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Activities
          </button>
          <button
            onClick={handleSaveActivity}
            disabled={loading || sessions.length === 0}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Saving...' : `Save Activity (${sessions.length} sessions)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalActivityLogger;
