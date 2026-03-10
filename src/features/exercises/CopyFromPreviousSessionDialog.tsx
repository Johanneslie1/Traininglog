import React, { useState, useEffect } from 'react';
import { ExerciseData } from '@/services/exerciseDataService';
import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';
import { SearchIcon, XIcon, CheckIcon } from '@heroicons/react/solid';
import { ActivityType } from '@/types/activityTypes';
import { resolveActivityTypeFromExerciseLike } from '@/utils/activityTypeResolver';
import AppOverlay from '@/components/ui/AppOverlay';
import { logger } from '@/utils/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onExercisesSelected: (exercises: ExerciseData[]) => void | Promise<void>;
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
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

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
      setCopyError(null);
      
      try {
        // Convert string date to Date object
        const dateObj = new Date(selectedDate);
        logger.debug('CopyFromPreviousSessionDialog: Fetching exercises for', {
          date: selectedDate,
          userId
        });

        const allExercises = await getAllExercisesByDate(dateObj, userId);

        logger.debug('CopyFromPreviousSessionDialog: Found exercises from unified source', {
          total: allExercises.length,
          date: dateObj.toLocaleDateString()
        });

        const mappedExercises = allExercises.map(exercise => ({
          id: exercise.id,
          exerciseName: exercise.exerciseName,
          sets: exercise.sets,
          timestamp: exercise.timestamp,
          userId: userId,
          deviceId: exercise.deviceId || '',
          activityType: resolveActivityTypeFromExerciseLike(
            {
              ...exercise,
              sets: exercise.sets as unknown as Array<Record<string, unknown>>,
            },
            {
              fallback: ActivityType.RESISTANCE,
              preferHintOverExplicit: true,
            }
          )
        }));

        const sortedExercises = mappedExercises.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setPreviousExercises(sortedExercises);
        setSelectedExercises(new Set());

        logger.debug('CopyFromPreviousSessionDialog: Total exercises available', sortedExercises.length);
      } catch (error) {
        logger.error('CopyFromPreviousSessionDialog: Error fetching exercises', error);
        setPreviousExercises([]);
        setSelectedExercises(new Set());
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

  const handleCopy = async () => {
    const selectedExercisesList = previousExercises
      .filter(ex => typeof ex.id === 'string' && ex.id.length > 0 && selectedExercises.has(ex.id))
      .map(({ id, ...exRest }) => ({
        ...exRest,
        timestamp: currentDate,
        id: crypto.randomUUID(), // Generate new ID for the copied exercise
        deviceId: window.navigator.userAgent // Set current device ID
      }));
    
    logger.debug('CopyFromPreviousSessionDialog: Copying exercises', {
      selectedCount: selectedExercises.size,
      exercisesToCopy: selectedExercisesList.length,
      exercises: selectedExercisesList
    });
    
    if (selectedExercisesList.length === 0) {
      logger.warn('CopyFromPreviousSessionDialog: No exercises selected for copying');
      onClose();
      return;
    }

    try {
      setCopying(true);
      setCopyError(null);
      await Promise.resolve(onExercisesSelected(selectedExercisesList));
      setCopySuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setCopySuccess(false);
      setCopyError(error instanceof Error ? error.message : 'Failed to copy selected exercises');
      logger.error('CopyFromPreviousSessionDialog: Copy failed', error);
    } finally {
      setCopying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AppOverlay
      isOpen={isOpen}
      onClose={onClose}
      className="z-50 flex items-center justify-center p-4 md:p-0"
      ariaLabel="Copy from previous session"
    >
      <div className="bg-bg-secondary rounded-lg w-full max-w-4xl h-[90vh] md:h-[80vh] flex flex-col text-text-primary border border-border relative" onMouseDown={(event) => event.stopPropagation()}>
        {/* Sticky Header */}
        <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-bg-secondary z-10">
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
          <div className="py-6 border-b border-border">
            <label className="block mb-2 text-sm font-medium text-text-secondary">Select a date:</label>
            <input
              type="date"
              className="w-full md:w-64 px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Search and Select All Section */}
          {!loading && previousExercises.length > 0 && (
            <div className="py-6 space-y-4 border-b border-border">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search exercises..."
                    className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 text-sm font-medium text-text-primary bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-tertiary rounded-lg hover:bg-bg-tertiary transition-colors"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="text-sm text-text-tertiary">
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
                          : 'border-border bg-bg-tertiary'
                      }`}>
                        {ex.id && selectedExercises.has(ex.id) && (
                          <CheckIcon className="w-4 h-4 text-text-primary" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="font-medium">{ex.exerciseName}</div>
                        <div className="text-sm text-text-tertiary">
                          {ex.sets?.length || 0} set{ex.sets?.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : selectedDate && (
                <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
                  <div className="text-lg">No exercises found for this date</div>
                  {searchQuery && (
                    <div className="mt-2">Try adjusting your search terms</div>
                  )}
                </div>
              )}
            </>
          )}

          {copyError && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {copyError}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-border p-6 sticky bottom-0 bg-bg-secondary z-10">
          <div className="flex justify-between items-center">
            <button
              className="px-4 py-2 text-text-tertiary hover:text-text-primary transition-colors"
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
                className="px-6 py-2 bg-accent-primary text-text-primary rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={handleCopy}
                disabled={selectedExercises.size === 0 || copying}
              >
                {copying ? 'Copying...' : 'Copy Selected'}
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
    </AppOverlay>
  );
};

export default CopyFromPreviousSessionDialog;
