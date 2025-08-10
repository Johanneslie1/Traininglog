import React, { useState, useEffect } from 'react';
import { ActivityType, SportActivity } from '@/types/activityTypes';
import { getExercisesByActivityType } from '@/services/exerciseDatabaseService';
import { teamSportsTemplate } from '@/config/defaultTemplates';
import UniversalActivityLogger from './UniversalActivityLogger';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';

interface SportActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null; // Add editing exercise prop
}

const SportActivityPicker: React.FC<SportActivityPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date(),
  editingExercise = null
}) => {
  const [sports, setSports] = useState<SportActivity[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportActivity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [view, setView] = useState<'list' | 'logging'>('list');

  useEffect(() => {
    loadSportActivities();
    
    // If editing an exercise, skip to logging view
    if (editingExercise) {
      // Create a mock sport activity based on the exercise name
      const mockSport: SportActivity = {
        id: editingExercise.id || 'editing-sport',
        name: editingExercise.exerciseName,
        category: 'general',
        description: '',
        isDefault: false,
        activityType: ActivityType.SPORT,
        sportType: 'general',
        skillLevel: 'intermediate',
        teamBased: false,
        equipment: [],
        primarySkills: [],
        metrics: {
          trackDuration: true,
          trackScore: false,
          trackIntensity: true,
          trackPerformance: false
        }
      };
      setSelectedSport(mockSport);
      setView('logging');
    }
  }, [editingExercise]);

  const loadSportActivities = () => {
    const exercises = getExercisesByActivityType(ActivityType.SPORT);
    const mapped = exercises.map((ex, index) => {
      const m: any = ex.metrics || {};
      return {
      id: ex.id || `sport-${index}`,
      name: ex.name,
      description: ex.description,
      activityType: ActivityType.SPORT,
      category: ex.category || 'general',
      isDefault: ex.isDefault ?? true,
      sportType: (ex as any).sportType || 'general',
      skillLevel: 'intermediate',
      teamBased: (ex as any).teamBased || false,
      equipment: ex.equipment || [],
      primarySkills: (ex as any).skills || [],
      metrics: {
        trackDuration: !!m.trackDuration || !!m.trackTime,
        trackScore: !!m.trackScore,
        trackIntensity: !!m.trackIntensity || !!m.trackRPE,
        trackPerformance: !!m.trackPerformance
      }
      } as SportActivity;
    });
    setSports(mapped);
  };

  const handleSportSelect = (sport: SportActivity) => {
    setSelectedSport(sport);
    setView('logging');
  };

  // Get unique categories for filtering
  const categories = ['All', ...Array.from(new Set(sports.flatMap(sport => sport.category ? [sport.category] : [])))];

  // Filter sports based on search and category
  const filteredSports = sports.filter(sport => {
    const matchesSearch = sport.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All' || 
      sport.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (view === 'logging' && selectedSport) {
    return (
      <UniversalActivityLogger
        template={teamSportsTemplate}
        activityName={selectedSport.name}
        onClose={onClose}
        onBack={() => setView('list')}
        onActivityLogged={onActivityLogged}
        selectedDate={selectedDate}
        editingExercise={editingExercise} // Pass editing exercise data
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
              <h2 className="text-2xl font-bold text-white">Sports Activities</h2>
              <p className="text-gray-400">Choose a sport to log your training session</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className="text-white text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-white/10">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search sports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category === 'All' ? '' : category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sports List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSports.map((sport) => (
              <div
                key={sport.id}
                onClick={() => handleSportSelect(sport)}
                className="p-4 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] cursor-pointer transition-colors border border-white/10"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{sport.name}</h3>
                {sport.description && (
                  <p className="text-gray-400 text-sm mb-3">{sport.description}</p>
                )}
                {sport.category && (
                  <span className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full">
                    {sport.category}
                  </span>
                )}
              </div>
            ))}
          </div>

          {filteredSports.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No sports found matching your criteria.</p>
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

export default SportActivityPicker;
