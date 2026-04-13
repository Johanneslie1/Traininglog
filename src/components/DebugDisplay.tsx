import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getAllExercisesByDate } from '../utils/unifiedExerciseUtils';
import { ActivityType } from '../types/activityTypes';

interface DebugDisplayProps {
  selectedDate: Date;
}

const DebugDisplay: React.FC<DebugDisplayProps> = ({ selectedDate }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const runDebugCheck = async () => {
      if (!user?.id) return;
      
      try {
        const exercises = await getAllExercisesByDate(selectedDate, user.id);
        const activityExercises = exercises.filter(ex => ex.activityType && ex.activityType !== ActivityType.RESISTANCE);
        const resistanceExercises = exercises.filter(ex => !ex.activityType || ex.activityType === ActivityType.RESISTANCE);
        
        let info = `📊 Exercise Loading Status:\n`;
        info += `Total: ${exercises.length} | Resistance: ${resistanceExercises.length} | Activities: ${activityExercises.length}\n\n`;
        
        if (activityExercises.length > 0) {
          info += `✅ Activity Exercises Found:\n`;
          activityExercises.forEach((ex, i) => {
            info += `${i + 1}. ${ex.exerciseName} (${ex.activityType})\n`;            if (ex.sets && ex.sets.length > 0) {
              const set = ex.sets[0] as any; // Cast to any to access activity-specific fields
              const hasActivityData = set.duration || set.distance || set.pace || set.calories || set.averageHeartRate;
              const hasResistanceData = set.weight || set.reps;
              
              info += `   Sets: ${ex.sets.length}, Activity data: ${hasActivityData ? '✓' : '✗'}, Resistance data: ${hasResistanceData ? '✗ (bad)' : '✓ (good)'}\n`;
              
              if (hasActivityData) {
                const sampleData = [];
                if (set.duration) sampleData.push(`${set.duration}min`);
                if (set.distance) sampleData.push(`${set.distance}km`);
                if (set.calories) sampleData.push(`${set.calories}cal`);
                if (set.pace) sampleData.push(`pace: ${set.pace}`);
                info += `   📊 Data: ${sampleData.join(', ')}\n`;
              }
              
              if (hasResistanceData) {
                info += `   ⚠️ Problem: ${set.weight}kg × ${set.reps} reps\n`;
              }
            }
            info += '\n';
          });
        } else {
          info += `⚠️ No activity exercises found.\n`;
          info += `💡 Try creating test data using the browser console:\n`;
          info += `   createTestExercises() or createAndTestActivity()\n`;
        }
        
        setDebugInfo(info);
      } catch (error) {
        setDebugInfo(`❌ Error: ${error}`);
      }
    };

    runDebugCheck();
  }, [selectedDate, user?.id]);

  if (!user?.id || !isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm z-50"
      >
        Debug Info
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md text-xs font-mono z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">Debug Info</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      <pre className="whitespace-pre-wrap">{debugInfo}</pre>
    </div>
  );
};

export default DebugDisplay;
