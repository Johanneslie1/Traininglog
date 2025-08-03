import React, { useState, useEffect } from 'react';
import { ExerciseData } from '@/services/exerciseDataService';
import { getExerciseLogsByDate } from '@/utils/localStorageUtils';
import { getExercisesByDateRange } from '@/services/firebase/queries';
import { SearchIcon, XIcon, CheckIcon } from '@heroicons/react/solid';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onExercisesSelected: (exercises: ExerciseData[]) => void;
  userId: string;
}

const CopyFromPreviousSessionDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  currentDate,
  onExercisesSelected,
  userId
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [previousExercises, setPreviousExercises] = useState<ExerciseData[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      if (!selectedDate || !userId) {
        setPreviousExercises([]);
        setSelectedExercises(new Set());
        setLoading(false);
        return;
      }

      setLoading(true);
      setCopySuccess(false);
      
      try {
        // Convert string date to Date object
        const dateObj = new Date(selectedDate);
        const start = new Date(dateObj);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateObj);
        end.setHours(23, 59, 59, 999);

        console.log('📅 CopyFromPreviousSessionDialog: Fetching exercises for:', {
          date: selectedDate,
          start: start.toISOString(),
          end: end.toISOString(),
          userId
        });

        // Get exercises from both sources
        const [firebaseExercises, localExercises] = await Promise.all([
          getExercisesByDateRange(userId, start, end),
          getExerciseLogsByDate(dateObj)
        ]);

        console.log('📦 Found exercises from both sources:', {
          firebase: firebaseExercises.length,
          local: localExercises.length,
          date: dateObj.toLocaleDateString()
        });

        // Convert Firebase exercises to ExerciseData
        const firebaseData = firebaseExercises.map(exercise => ({
          id: exercise.id,
          exerciseName: exercise.exerciseName,
          sets: exercise.sets,
          timestamp: exercise.timestamp,
          userId: userId,
          deviceId: exercise.deviceId || ''
        }));

        // Convert local exercises to ExerciseData, excluding those already in Firebase
        const localData = localExercises
          .filter(local => !firebaseData.some(fb => fb.id === local.id))
          .map(exercise => ({
            id: exercise.id,
            exerciseName: exercise.exerciseName,
            sets: exercise.sets,
            timestamp: new Date(exercise.timestamp),
            userId: userId,
            deviceId: exercise.deviceId || ''
          }));

        // Combine and sort by timestamp
        const allExercises = [...firebaseData, ...localData].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setPreviousExercises(allExercises);
        setSelectedExercises(new Set());

        console.log('✅ Total exercises available:', allExercises.length);
      } catch (error) {
        console.error('❌ Error fetching exercises:', error);
        // Fallback to local storage on error
        try {
          const localExercises = getExerciseLogsByDate(new Date(selectedDate));
          setPreviousExercises(localExercises.map(ex => ({
            id: ex.id,
            exerciseName: ex.exerciseName,
            sets: ex.sets,
            timestamp: new Date(ex.timestamp),
            userId: userId,
            deviceId: ex.deviceId || ''
          })));
          setSelectedExercises(new Set());
          console.log('⚠️ Fallback to local storage successful');
        } catch (fallbackError) {
          console.error('❌ Fallback to local storage failed:', fallbackError);
          setPreviousExercises([]);
          setSelectedExercises(new Set());
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [selectedDate, userId]);

  const handleToggleExercise = (id: string | undefined) => {
    if (!id) return;
    setSelectedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredExercises = previousExercises.filter(ex =>
    ex.exerciseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = () => {
    const validExerciseIds = filteredExercises
      .map(ex => ex.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    setSelectedExercises(new Set(validExerciseIds));
  };

  const handleDeselectAll = () => {
    setSelectedExercises(new Set());
  };

  const handleCopy = () => {
    const selectedExercisesList = previousExercises
      .filter(ex => typeof ex.id === 'string' && ex.id.length > 0 && selectedExercises.has(ex.id))
      .map(({ id, ...exRest }) => ({
        ...exRest,
        timestamp: currentDate
      }));
    
    if (selectedExercisesList.length > 0) {
      onExercisesSelected(selectedExercisesList);
      setCopySuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 md:p-0">
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-4xl h-[90vh] md:h-[80vh] flex flex-col text-white border border-white/10 relative">
        {/* Sticky Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-[#1a1a1a] z-10">
          <h2 className="text-2xl font-medium">Copy from Previous Session</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6">
          {/* Date Picker Section */}
          <div className="py-6 border-b border-white/10">
            <label className="block mb-2 text-sm font-medium text-gray-300">Select a date:</label>
            <input
              type="date"
              className="w-full md:w-64 px-4 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Search and Select All Section */}
          {!loading && previousExercises.length > 0 && (
            <div className="py-6 space-y-4 border-b border-white/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search exercises..."
                    className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
              </div>
            </div>
          )}

          {/* Exercise List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
              {filteredExercises.length > 0 ? (
                <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredExercises.map((ex) => (
                    <label
                      key={ex.id}
                      className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors ${
                        ex.id && selectedExercises.has(ex.id)
                          ? 'bg-purple-500/20 border border-purple-500/50'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={ex.id ? selectedExercises.has(ex.id) : false}
                        onChange={() => handleToggleExercise(ex.id)}
                        disabled={!ex.id}
                      />
                      <div className={`w-6 h-6 flex items-center justify-center rounded-md border ${
                        ex.id && selectedExercises.has(ex.id)
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-white/30 bg-[#2a2a2a]'
                      }`}>
                        {ex.id && selectedExercises.has(ex.id) && (
                          <CheckIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="font-medium">{ex.exerciseName}</div>
                        <div className="text-sm text-gray-400">
                          {ex.sets?.length || 0} set{ex.sets?.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : selectedDate && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="text-lg">No exercises found for this date</div>
                  {searchQuery && (
                    <div className="mt-2">Try adjusting your search terms</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-white/10 p-6 sticky bottom-0 bg-[#1a1a1a] z-10">
          <div className="flex justify-between items-center">
            <button
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              {copySuccess && (
                <span className="text-green-500 flex items-center">
                  <CheckIcon className="w-5 h-5 mr-1" />
                  Copied successfully!
                </span>
              )}
              <button
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={handleCopy}
                disabled={selectedExercises.size === 0}
              >
                Copy Selected
                {selectedExercises.size > 0 && (
                  <span className="bg-purple-700 px-2 py-0.5 rounded-full text-sm">
                    {selectedExercises.size}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopyFromPreviousSessionDialog;
