import React, { useState, useEffect } from 'react';
import { ActivityType } from '@/types/activityTypes';
import ResistanceActivityPicker from './ResistanceActivityPicker';
import SportActivityPicker from './SportActivityPicker';
import StretchingActivityPicker from './StretchingActivityPicker';
import EnduranceActivityPicker from './EnduranceActivityPicker';
import OtherActivityPicker from './OtherActivityPicker';
import SpeedAgilityActivityPicker from './SpeedAgilityActivityPicker';
import { getExercisesByActivityType } from '@/services/exerciseDatabaseService';

interface MultiActivityLoggerProps {
  onClose: () => void;
  onActivityAdded?: () => void;
  selectedDate?: Date;
}

const MultiActivityLogger: React.FC<MultiActivityLoggerProps> = ({
  onClose,
  onActivityAdded,
  selectedDate
}) => {
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType | null>(null);

  const activityTypes = [
    {
      type: ActivityType.RESISTANCE,
      name: 'Resistance Training',
      description: 'Weight lifting, strength training',
      icon: '🏋️‍♂️',
      color: 'from-blue-500 to-blue-700',
      fallback: 'Squats, Deadlifts, Bench Press'
    },
    {
      type: ActivityType.SPORT,
      name: 'Sports',
      description: 'Team sports, individual competitions',
      icon: '⚽',
      color: 'from-green-500 to-green-700',
      fallback: 'Football, Basketball, Tennis'
    },
    {
      type: ActivityType.STRETCHING,
      name: 'Stretching & Flexibility',
      description: 'Static stretches, yoga, mobility',
      icon: '🧘‍♀️',
      color: 'from-purple-500 to-purple-700',
      fallback: 'Yoga, Static Stretches, PNF'
    },
    {
      type: ActivityType.ENDURANCE,
      name: 'Endurance Training',
      description: 'Cardio, running, cycling',
      icon: '🏃‍♂️',
      color: 'from-red-500 to-red-700',
      fallback: 'Running, Cycling, Swimming'
    },
    {
      type: ActivityType.SPEED_AGILITY,
      name: 'Speed & Agility',
      description: 'Sprint training, agility drills',
      icon: '⚡',
      color: 'from-yellow-500 to-orange-700',
      fallback: 'Sprints, Cone Drills, Ladder Drills'
    },
    {
      type: ActivityType.OTHER,
      name: 'Other Activities',
      description: 'Custom activities, therapy, wellness',
      icon: '🎯',
      color: 'from-gray-500 to-gray-700',
      fallback: 'Meditation, Physiotherapy, Dance'
    }
  ] as const;

  // Dynamic exercise previews state
  type PreviewMap = Partial<Record<ActivityType, { status: 'loading' | 'ready' | 'empty' | 'error'; names: string[] }>>;
  const [previews, setPreviews] = useState<PreviewMap>({});

  useEffect(() => {
    // Load previews once on mount
    let isCancelled = false;
    const loadAll = () => {
      const next: PreviewMap = {};
      activityTypes.forEach(cfg => {
        try {
          const exs = getExercisesByActivityType(cfg.type) || [];
          if (exs.length === 0) {
            next[cfg.type] = { status: 'empty', names: [] };
          } else {
            const names = exs.slice(0, 3).map(e => e.name).filter(Boolean);
            next[cfg.type] = { status: 'ready', names };
          }
        } catch (e) {
          next[cfg.type] = { status: 'error', names: [] };
        }
      });
      if (!isCancelled) setPreviews(next);
    };
    // Initialize as loading
    const initial: PreviewMap = {};
    activityTypes.forEach(cfg => { initial[cfg.type] = { status: 'loading', names: [] }; });
    setPreviews(initial);
    // Slight timeout to allow UI paint (optional)
    setTimeout(loadAll, 0);
    return () => { isCancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActivityTypeSelect = (activityType: ActivityType) => {
    setSelectedActivityType(activityType);
  };

  const handleBack = () => {
    setSelectedActivityType(null);
  };

  const handleActivityLogged = () => {
    onActivityAdded?.();
    onClose();
  };

  // Main activity type selection screen
  if (!selectedActivityType) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1a1a1a] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Log Activity</h2>
                <p className="text-gray-400 mt-1">Choose your activity type to get started</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Activity Type Cards */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activityTypes.map((activity) => (
                <button
                  key={activity.type}
                  onClick={() => handleActivityTypeSelect(activity.type)}
                  className="group p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 text-left bg-gradient-to-br from-transparent to-white/5 hover:to-white/10"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${activity.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {activity.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 min-h-[1.25rem]">
                        {(() => {
                          const preview = previews[activity.type];
                          if (!preview || preview.status === 'loading') return 'Loading…';
                          if (preview.status === 'error') return activity.fallback;
                          if (preview.status === 'empty') return activity.fallback;
                          if (preview.names.length === 0) return activity.fallback;
                          return preview.names.join(', ');
                        })()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <p className="text-sm text-gray-400 text-center">
              Select an activity type to access specialized logging features and databases
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render specific activity logger based on selected type
  switch (selectedActivityType) {
    case ActivityType.RESISTANCE:
      return (
        <ResistanceActivityPicker
          onClose={onClose}
          onBack={handleBack}
          onActivityLogged={handleActivityLogged}
          selectedDate={selectedDate}
        />
      );
    case ActivityType.SPORT:
      return (
        <SportActivityPicker
          onClose={onClose}
          onBack={handleBack}
          onActivityLogged={handleActivityLogged}
          selectedDate={selectedDate}
        />
      );
    case ActivityType.STRETCHING:
      return (
        <StretchingActivityPicker
          onClose={onClose}
          onBack={handleBack}
          onActivityLogged={handleActivityLogged}
          selectedDate={selectedDate}
        />
      );
    case ActivityType.ENDURANCE:
      return (
        <EnduranceActivityPicker
          onClose={onClose}
          onBack={handleBack}
          onActivityLogged={handleActivityLogged}
          selectedDate={selectedDate}
        />
      );
    case ActivityType.SPEED_AGILITY:
      return (
        <SpeedAgilityActivityPicker
          onClose={onClose}
          onBack={handleBack}
          selectedDate={selectedDate}
          onActivityLogged={handleActivityLogged}
        />
      );
    case ActivityType.OTHER:
      return (
        <OtherActivityPicker
          onClose={onClose}
          onBack={handleBack}
          onActivityLogged={handleActivityLogged}
          selectedDate={selectedDate}
        />
      );
    default:
      return null;
  }
};

export default MultiActivityLogger;
