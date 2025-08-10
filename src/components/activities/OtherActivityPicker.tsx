import React, { useState, useEffect } from 'react';
import { ActivityType, OtherActivity } from '@/types/activityTypes';
import { activityService } from '@/services/activityService';
import { otherTemplate } from '@/config/defaultTemplates';
import UniversalActivityLogger from './UniversalActivityLogger';

interface OtherActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
}

const OtherActivityPicker: React.FC<OtherActivityPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date()
}) => {
  const [activities, setActivities] = useState<OtherActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<OtherActivity | null>(null);
  const [view, setView] = useState<'list' | 'logging'>('list');

  useEffect(() => {
    const otherActivities = activityService.getActivitiesByType(ActivityType.OTHER);
    setActivities(otherActivities.map((activity, index) => ({
      ...activity,
      id: `other-${index}`
    })) as OtherActivity[]);
  }, []);

  const handleActivitySelect = (activity: OtherActivity) => {
    setSelectedActivity(activity);
    setView('logging');
  };

  if (view === 'logging' && selectedActivity) {
    return (
      <UniversalActivityLogger
        template={otherTemplate}
        activityName={selectedActivity.name}
        onClose={onClose}
        onBack={() => setView('list')}
        onActivityLogged={onActivityLogged}
        selectedDate={selectedDate}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Other Activities</h2>
              <p className="text-gray-400">Log miscellaneous training and recreational activities</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className="text-white text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => handleActivitySelect(activity)}
                className="p-4 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] cursor-pointer transition-colors border border-white/10"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{activity.name}</h3>
                {activity.description && (
                  <p className="text-gray-400 text-sm mb-3">{activity.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>📊</span>
                  <span>Duration, Calories, Heart Rate, Intensity</span>
                </div>
              </div>
            ))}
          </div>

          {activities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No other activities available.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onBack}
            className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Activity Types
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtherActivityPicker;
