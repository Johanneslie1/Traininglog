import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { ExerciseData } from '@/services/exerciseDataService';
import { startOfDay, endOfDay } from '@/utils/dateUtils';

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

  useEffect(() => {
    if (selectedDate && userId) {
      setLoading(true);
      const start = startOfDay(new Date(selectedDate));
      const end = endOfDay(new Date(selectedDate));

      const exercisesQuery = query(
        collection(db, 'exerciseLogs'),
        where('userId', '==', userId),
        where('timestamp', '>=', start),
        where('timestamp', '<=', end)
      );

      getDocs(exercisesQuery)
        .then((snapshot) => {
          const exercises = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as ExerciseData));
          setPreviousExercises(exercises);
          // Clear selected exercises when loading new data
          setSelectedExercises(new Set());
        })
        .catch(error => {
          console.error('Error fetching exercises:', error);
        })
        .finally(() => setLoading(false));
    } else {
      setPreviousExercises([]);
      setSelectedExercises(new Set());
    }
  }, [selectedDate, userId]);

  const handleToggleExercise = (id: string | undefined) => {
    if (!id) return; // Guard against undefined IDs
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

  const handleSelectAll = () => {
    // Create a set of all valid exercise IDs
    const validExerciseIds = previousExercises
      .map(ex => ex.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    setSelectedExercises(new Set(validExerciseIds));
  };

  const handleCopy = () => {
    const selectedExercisesList = previousExercises
      .filter(ex => typeof ex.id === 'string' && ex.id.length > 0 && selectedExercises.has(ex.id))
      .map(ex => ({
        ...ex,
        timestamp: currentDate,
        // Omit the id to ensure a new one is generated
        id: undefined
      }));
    
    if (selectedExercisesList.length > 0) {
      onExercisesSelected(selectedExercisesList);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md text-white border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Copy from Previous Session</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm text-gray-300">Select a date:</label>            <input
              type="date"
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}

        {!loading && previousExercises.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                {previousExercises.length} exercise{previousExercises.length !== 1 ? 's' : ''} found
              </span>
              <button
                className="text-sm text-purple-400 hover:text-purple-300"
                onClick={handleSelectAll}
                type="button"
              >
                Select All
              </button>
            </div>

            <div className="mb-6 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {previousExercises.map((ex) => (
                <label 
                  key={ex.id} 
                  className="flex items-center p-2 hover:bg-white/5 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="form-checkbox rounded border-white/10 bg-[#2a2a2a] text-purple-500 focus:ring-purple-500"
                    checked={ex.id ? selectedExercises.has(ex.id) : false}
                    onChange={() => ex.id && handleToggleExercise(ex.id)}
                    disabled={!ex.id}
                  />
                  <span className="ml-3">{ex.exerciseName}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCopy}
                disabled={selectedExercises.size === 0}
              >
                Copy Selected
              </button>
            </div>
          </>
        )}

        {!loading && previousExercises.length === 0 && selectedDate && (
          <div className="text-center py-4 text-gray-400">
            No exercises found for this date
          </div>
        )}
      </div>
    </div>
  );
};

export default CopyFromPreviousSessionDialog;
