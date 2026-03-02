import React, { useState, useEffect, useMemo } from 'react';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { ExerciseLog } from '@/types/exercise';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import { auth } from '@/services/firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { getExerciseLogs } from '@/utils/localStorageUtils';
import { 
  SearchIcon, 
  FilterIcon, 
  HeartIcon, 
  ClockIcon, 
  TrendingUpIcon,
  DuplicateIcon,
  CalendarIcon 
} from '@heroicons/react/outline';

const mapActivityTypeToExerciseType = (activityType: ActivityType): Exercise['type'] => {
  switch (activityType) {
    case ActivityType.RESISTANCE:
      return 'strength';
    case ActivityType.ENDURANCE:
      return 'endurance';
    case ActivityType.STRETCHING:
      return 'flexibility';
    case ActivityType.SPORT:
      return 'teamSports';
    case ActivityType.SPEED_AGILITY:
      return 'speedAgility';
    case ActivityType.OTHER:
    default:
      return 'other';
  }
};

interface ExerciseHistoryPickerProps {
  onClose: () => void;
  onSelectExercises: (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => void;
}

interface ExerciseStats {
  name: string;
  lastPerformed: Date;
  totalSessions: number;
  isFavorite: boolean;
  bestSet?: ExerciseSet;
  exerciseLog: ExerciseLog;
}

type FilterType = 'all' | 'favorites' | 'recent' | 'most-performed';

export const ExerciseHistoryPicker: React.FC<ExerciseHistoryPickerProps> = ({
  onClose,
  onSelectExercises
}) => {
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showCopyDay, setShowCopyDay] = useState(false);

  // Load exercise logs and favorites on mount
  useEffect(() => {
    loadExerciseHistory();
    loadFavorites();
  }, []);

  // Load exercise logs from Firestore
  const getAllExerciseLogsFromFirestore = async (): Promise<ExerciseLog[]> => {
    const user = auth.currentUser;
    if (!user) {
      console.warn('No authenticated user, falling back to localStorage');
      return getExerciseLogs();
    }

    try {
      console.log('🔍 Fetching all exercises from Firestore...');
      const exercisesRef = collection(db, 'users', user.uid, 'exercises');
      const q = query(exercisesRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      const exercises: ExerciseLog[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        exercises.push({
          id: doc.id,
          exerciseName: data.exerciseName,
          sets: data.sets,
          timestamp: data.timestamp.toDate(),
          deviceId: data.deviceId || '',
          userId: data.userId
        });
      });

      console.log(`✅ Retrieved ${exercises.length} exercises from Firestore`);
      return exercises;
    } catch (error) {
      console.error('❌ Error fetching exercises from Firestore, falling back to localStorage:', error);
      return getExerciseLogs();
    }
  };

  const loadExerciseHistory = async () => {
    try {
      setLoading(true);
      const logs = await getAllExerciseLogsFromFirestore();
      setExerciseLogs(logs);
    } catch (err) {
      console.error('Error loading exercise history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load exercise history');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('exercise-favorites');
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  const saveFavorites = (newFavorites: Set<string>) => {
    try {
      localStorage.setItem('exercise-favorites', JSON.stringify(Array.from(newFavorites)));
      setFavorites(newFavorites);
    } catch (err) {
      console.error('Error saving favorites:', err);
    }
  };

  // Process exercise logs into stats
  const exerciseStats = useMemo(() => {
    const statsMap = new Map<string, ExerciseStats>();

    exerciseLogs.forEach(log => {
      const existing = statsMap.get(log.exerciseName);
      if (existing) {
        existing.totalSessions++;
        if (log.timestamp > existing.lastPerformed) {
          existing.lastPerformed = log.timestamp;
          existing.exerciseLog = log;
        }
        // Update best set if current log has a better set
        const bestLogSet = log.sets.reduce((best, set) => {
          const currentScore = (set.weight || 0) * (set.reps || 0);
          const bestScore = (best.weight || 0) * (best.reps || 0);
          return currentScore > bestScore ? set : best;
        }, log.sets[0]);
        
        if (bestLogSet && existing.bestSet) {
          const currentBestScore = (existing.bestSet.weight || 0) * (existing.bestSet.reps || 0);
          const newScore = (bestLogSet.weight || 0) * (bestLogSet.reps || 0);
          if (newScore > currentBestScore) {
            existing.bestSet = bestLogSet;
          }
        }
      } else {
        const bestSet = log.sets.reduce((best, set) => {
          const currentScore = (set.weight || 0) * (set.reps || 0);
          const bestScore = (best.weight || 0) * (best.reps || 0);
          return currentScore > bestScore ? set : best;
        }, log.sets[0]);

        statsMap.set(log.exerciseName, {
          name: log.exerciseName,
          lastPerformed: log.timestamp,
          totalSessions: 1,
          isFavorite: favorites.has(log.exerciseName),
          bestSet,
          exerciseLog: log
        });
      }
    });

    return Array.from(statsMap.values());
  }, [exerciseLogs, favorites]);

  // Filter and sort exercises
  const filteredExercises = useMemo(() => {
    let filtered = exerciseStats.filter(stat => 
      stat.name.toLowerCase().includes(searchText.toLowerCase())
    );

    switch (selectedFilter) {
      case 'favorites':
        filtered = filtered.filter(stat => stat.isFavorite);
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => b.lastPerformed.getTime() - a.lastPerformed.getTime()).slice(0, 20);
        break;
      case 'most-performed':
        filtered = filtered.sort((a, b) => b.totalSessions - a.totalSessions);
        break;
      default:
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [exerciseStats, searchText, selectedFilter]);

  // Get unique dates for copy day feature
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    exerciseLogs.forEach(log => {
      const dateStr = log.timestamp.toISOString().split('T')[0];
      dates.add(dateStr);
    });
    return Array.from(dates).sort().reverse();
  }, [exerciseLogs]);

  const toggleFavorite = (exerciseName: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(exerciseName)) {
      newFavorites.delete(exerciseName);
    } else {
      newFavorites.add(exerciseName);
    }
    saveFavorites(newFavorites);
  };

  const toggleExerciseSelection = (exerciseName: string) => {
    const newSelection = new Set(selectedExercises);
    if (newSelection.has(exerciseName)) {
      newSelection.delete(exerciseName);
    } else {
      newSelection.add(exerciseName);
    }
    setSelectedExercises(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedExercises.size === filteredExercises.length) {
      setSelectedExercises(new Set());
    } else {
      setSelectedExercises(new Set(filteredExercises.map(stat => stat.name)));
    }
  };

  const handleCopyDay = () => {
    if (!selectedDate) return;

    const dayLogs = exerciseLogs.filter(log => {
      const logDate = log.timestamp.toISOString().split('T')[0];
      return logDate === selectedDate;
    });

    const exercisesToAdd = dayLogs.map(log => {
      const activityType = normalizeActivityType(log.activityType);
      const isResistance = activityType === ActivityType.RESISTANCE;

      return {
      exercise: {
        id: `exercise-${log.exerciseName.toLowerCase().replace(/\s+/g, '-')}`,
        name: log.exerciseName,
        type: mapActivityTypeToExerciseType(activityType),
        category: 'compound' as const,
        primaryMuscles: [],
        secondaryMuscles: [],
        instructions: [],
        description: `Copied from ${selectedDate}`,
        defaultUnit: isResistance ? ('kg' as const) : ('time' as const),
        metrics: {
          trackWeight: isResistance,
          trackReps: isResistance,
          trackTime: !isResistance,
        },
        activityType
      },
      sets: log.sets
    }});

    onSelectExercises(exercisesToAdd);
  };

  const handleAddSelected = () => {
    const exercisesToAdd = Array.from(selectedExercises).map(exerciseName => {
      const stat = exerciseStats.find(s => s.name === exerciseName);
      if (!stat) return null;

      const activityType = normalizeActivityType(stat.exerciseLog.activityType);
      const isResistance = activityType === ActivityType.RESISTANCE;

      return {
        exercise: {
          id: `exercise-${exerciseName.toLowerCase().replace(/\s+/g, '-')}`,
          name: exerciseName,
          type: mapActivityTypeToExerciseType(activityType),
          category: 'compound' as const,
          primaryMuscles: [],
          secondaryMuscles: [],
          instructions: [],
          description: `Added from exercise history`,
          defaultUnit: isResistance ? ('kg' as const) : ('time' as const),
          metrics: {
            trackWeight: isResistance,
            trackReps: isResistance,
            trackTime: !isResistance,
          },
          activityType
        },
        sets: stat.exerciseLog.sets
      };
    }).filter(Boolean);

    onSelectExercises(exercisesToAdd as { exercise: Exercise; sets: ExerciseSet[] }[]);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-[120]">
        <div className="bg-[#23272F] p-8 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-white">Loading exercise history...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-[120]">
        <div className="bg-[#23272F] p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-white mb-4">{error}</p>
          <div className="flex gap-2">
            <button onClick={loadExerciseHistory} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Retry
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-[120]">
      <div className="bg-[#23272F] rounded-lg w-full max-w-4xl h-5/6 flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Add Exercises from History</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#181A20] text-white rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCopyDay(!showCopyDay)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  showCopyDay ? 'bg-blue-600 text-white' : 'bg-[#181A20] text-gray-300 hover:bg-gray-700'
                }`}
              >
                <DuplicateIcon className="w-4 h-4" />
                Copy Day
              </button>
            </div>
          </div>

          {/* Copy Day Section */}
          {showCopyDay && (
            <div className="mb-4 p-4 bg-[#181A20] rounded-lg border border-white/10">
              <div className="flex items-center gap-4">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#23272F] text-white rounded border border-white/10"
                >
                  <option value="">Select a date to copy...</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString()} ({exerciseLogs.filter(log => 
                        log.timestamp.toISOString().split('T')[0] === date
                      ).length} exercises)
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleCopyDay}
                  disabled={!selectedDate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Copy Day
                </button>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All', icon: FilterIcon },
              { key: 'favorites', label: 'Favorites', icon: HeartIcon },
              { key: 'recent', label: 'Recent', icon: ClockIcon },
              { key: 'most-performed', label: 'Most Performed', icon: TrendingUpIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedFilter(key as FilterType)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  selectedFilter === key 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-[#181A20] text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredExercises.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No exercises found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select All */}
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <button
                  onClick={handleSelectAll}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {selectedExercises.size === filteredExercises.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-gray-400 text-sm">
                  {selectedExercises.size} of {filteredExercises.length} selected
                </span>
              </div>

              {filteredExercises.map((stat) => (
                <div
                  key={stat.name}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedExercises.has(stat.name)
                      ? 'bg-blue-900/30 border-blue-500'
                      : 'bg-[#181A20] border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => toggleExerciseSelection(stat.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedExercises.has(stat.name)}
                            onChange={() => toggleExerciseSelection(stat.name)}
                            className="w-4 h-4"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <h3 className="text-white font-medium">{stat.name}</h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(stat.name);
                          }}
                          className={`p-1 rounded ${
                            stat.isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <HeartIcon className={`w-4 h-4 ${stat.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Last: {formatDate(stat.lastPerformed)}</span>
                        <span>{stat.totalSessions} session{stat.totalSessions !== 1 ? 's' : ''}</span>
                        {stat.bestSet && (
                          <span>
                            Best: {stat.bestSet.weight || 0}kg × {stat.bestSet.reps || 0}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              {selectedExercises.size} exercise{selectedExercises.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSelected}
                disabled={selectedExercises.size === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add {selectedExercises.size > 0 ? `${selectedExercises.size} ` : ''}Exercise{selectedExercises.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseHistoryPicker;
