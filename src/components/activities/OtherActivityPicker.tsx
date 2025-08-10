import React, { useState, useEffect } from 'react';
import { ActivityType, OtherActivity } from '@/types/activityTypes';
import { getExercisesByActivityType } from '@/services/exerciseDatabaseService';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [view, setView] = useState<'list' | 'logging'>('list');

  useEffect(() => {
    const exercises = getExercisesByActivityType(ActivityType.OTHER);
    setActivities(exercises.map((ex, index) => ({
      id: ex.id || `other-${index}`,
      name: ex.name,
      description: ex.description,
      activityType: ActivityType.OTHER,
      category: ex.category || 'general',
      isDefault: ex.isDefault ?? true,
      customCategory: ex.category || 'general',
      customFields: [],
      metrics: Object.keys(ex.metrics || {}).reduce((acc: any, k) => { acc[k] = true; return acc; }, {})
    })) as OtherActivity[]);
  }, []);

  const handleActivitySelect = (activity: OtherActivity) => {
    setSelectedActivity(activity);
    setView('logging');
  };

  const categories = ['All', ...Array.from(new Set(activities.flatMap(a => a.category ? [a.category] : [])))];
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All' || activity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

        {/* Search & Filter */}
        <div className="p-6 border-b border-white/10">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search other activities..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category === 'All' ? '' : category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActivities.map((activity) => (
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

          {filteredActivities.length === 0 && (
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
