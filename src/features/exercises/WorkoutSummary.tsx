import React from 'react';
import { DifficultyCategory } from './ExerciseSetLogger';

interface WorkoutSummaryProps {
  exercises: Array<{
    id: string;
    exerciseName: string;
    sets: Array<{
      reps: number;
      weight: number;
      difficulty?: DifficultyCategory;
      rpe?: number;
    }>;
    timestamp: Date;
  }>;
  onClose: () => void;
}

// Exercise icon mapping
const getExerciseIcon = (exerciseName: string) => {
  const name = exerciseName.toLowerCase();
  
  if (name.includes('squat') || name.includes('leg press')) {
    return '🏋️'; // Squat icon
  } else if (name.includes('bench') || name.includes('press') && name.includes('chest')) {
    return '💪'; // Bench press icon
  } else if (name.includes('deadlift') || name.includes('row')) {
    return '🔥'; // Deadlift icon
  } else if (name.includes('curl') || name.includes('bicep')) {
    return '💪'; // Curl icon
  } else if (name.includes('pull') || name.includes('chin')) {
    return '🔙'; // Pull-up icon
  } else if (name.includes('shoulder') || name.includes('overhead')) {
    return '🏋️'; // Shoulder press icon
  } else if (name.includes('core') || name.includes('plank') || name.includes('crunch')) {
    return '🏃'; // Core icon
  } else if (name.includes('cardio') || name.includes('run') || name.includes('bike')) {
    return '🏃'; // Cardio icon
  }
  
  return '💪'; // Default icon
};

export const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
  exercises,
  onClose
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTotalSets = () => {
    return exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  };

  const getTotalVolume = () => {
    return exercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((exerciseTotal, set) => {
        return exerciseTotal + (set.weight * set.reps);
      }, 0);
    }, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full max-w-md mx-4 bg-[#1a1a1a] rounded-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 p-4 text-center">
          <div className="text-white text-lg font-bold mb-1">Workout Complete!</div>
          <div className="text-green-100 text-sm">
            {formatDate(exercises[0]?.timestamp || new Date())}
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-white text-xl font-bold">{exercises.length}</div>
              <div className="text-gray-400 text-sm">Exercises</div>
            </div>
            <div>
              <div className="text-white text-xl font-bold">{getTotalSets()}</div>
              <div className="text-gray-400 text-sm">Sets</div>
            </div>
            <div>
              <div className="text-white text-xl font-bold">{getTotalVolume().toLocaleString()}</div>
              <div className="text-gray-400 text-sm">Total kg</div>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="max-h-[50vh] overflow-y-auto">
          {exercises.map((exercise) => (
            <div key={exercise.id} className="flex items-center p-4 border-b border-gray-800">
              {/* Exercise Icon */}
              <div className="w-12 h-12 bg-[#333] rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">{getExerciseIcon(exercise.exerciseName)}</span>
              </div>

              {/* Exercise Details */}
              <div className="flex-1">
                <h3 className="text-white font-medium text-base mb-1">
                  {exercise.exerciseName}
                </h3>
                
                {/* Sets Summary */}
                <div className="flex flex-wrap gap-1">
                  {exercise.sets.map((set, setIndex) => {
                    // Determine color based on difficulty
                    let bgColor = 'bg-gray-700';
                    if (set.difficulty) {
                      switch (set.difficulty) {
                        case 'WARMUP': bgColor = 'bg-blue-600'; break;
                        case 'EASY': bgColor = 'bg-green-600'; break;
                        case 'NORMAL': bgColor = 'bg-yellow-600'; break;
                        case 'HARD': bgColor = 'bg-red-600'; break;
                        case 'FAILURE': bgColor = 'bg-orange-600'; break;
                        case 'DROP': bgColor = 'bg-purple-600'; break;
                      }
                    }

                    return (
                      <div
                        key={setIndex}
                        className={`${bgColor} text-white text-xs px-2 py-1 rounded`}
                      >
                        {set.weight}kg × {set.reps}
                      </div>
                    );
                  })}
                </div>

                {/* Exercise Volume */}
                <div className="text-gray-400 text-sm mt-1">
                  {exercise.sets.reduce((total, set) => total + (set.weight * set.reps), 0).toLocaleString()} kg total
                </div>
              </div>

              {/* Set Count */}
              <div className="text-gray-400 text-sm">
                {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4">
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSummary;
