import React, { useState, useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { DifficultyCategory } from '@/types/difficulty';
import { LightBulbIcon, SparklesIcon } from '@heroicons/react/outline';

interface AISuggestionsProps {
  selectedExercises: { exercise: Exercise; sets: ExerciseSet[] }[];
  onAddSuggestion: (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => void;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  exercises: { exercise: Exercise; sets: ExerciseSet[] }[];
  type: 'complementary' | 'progression' | 'recovery';
}

const AISuggestions: React.FC<AISuggestionsProps> = ({
  selectedExercises,
  onAddSuggestion
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedExercises.length > 0) {
      generateSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [selectedExercises]);

  const generateSuggestions = () => {
    setLoading(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const newSuggestions: Suggestion[] = [];

      // Advanced analysis of current exercises
      const exerciseNames = selectedExercises.map(item => item.exercise.name.toLowerCase());
      const muscleGroups = {
        chest: exerciseNames.some(name => name.includes('bench') || name.includes('push') || name.includes('chest') || name.includes('fly')),
        back: exerciseNames.some(name => name.includes('pull') || name.includes('row') || name.includes('lat') || name.includes('deadlift')),
        legs: exerciseNames.some(name => name.includes('squat') || name.includes('leg') || name.includes('lunge') || name.includes('calf')),
        shoulders: exerciseNames.some(name => name.includes('press') || name.includes('shoulder') || name.includes('raise') || name.includes('lateral')),
        arms: exerciseNames.some(name => name.includes('curl') || name.includes('tricep') || name.includes('bicep') || name.includes('extension')),
        core: exerciseNames.some(name => name.includes('plank') || name.includes('crunch') || name.includes('ab') || name.includes('core'))
      };

      // Calculate training volume and intensity
      const totalSets = selectedExercises.reduce((sum, item) => sum + item.sets.length, 0);
      const avgIntensity = selectedExercises.reduce((sum, item) => {
        const setIntensity = item.sets.reduce((setSum, set) => {
          const weight = set.weight || 0;
          const reps = set.reps || 0;
          return setSum + (weight * reps);
        }, 0);
        return sum + setIntensity / item.sets.length;
      }, 0) / selectedExercises.length;

      // Movement pattern analysis
      const movementPatterns = {
        push: exerciseNames.some(name => name.includes('press') || name.includes('push') || name.includes('dip')),
        pull: exerciseNames.some(name => name.includes('pull') || name.includes('row') || name.includes('chin')),
        squat: exerciseNames.some(name => name.includes('squat') || name.includes('leg press')),
        hinge: exerciseNames.some(name => name.includes('deadlift') || name.includes('rdl') || name.includes('hip hinge')),
        carry: exerciseNames.some(name => name.includes('carry') || name.includes('walk') || name.includes('suitcase'))
      };

      // EVIDENCE-BASED SUGGESTIONS

      // 1. Muscle Balance Optimization
      if (muscleGroups.chest && !muscleGroups.back) {
        newSuggestions.push({
          id: 'balance-posterior',
          title: 'Posterior Chain Balance',
          description: 'NSCA guidelines recommend 1:1 push-to-pull ratio for optimal shoulder health',
          type: 'complementary',
          exercises: [{
            exercise: {
              id: 'bent-over-row',
              name: 'Bent-Over Barbell Row',
              type: 'strength',
              category: 'compound',
              primaryMuscles: ['back', 'lats'],
              secondaryMuscles: ['biceps', 'traps'],
              instructions: ['Maintain neutral spine', 'Pull to lower chest', 'Control eccentric phase'],
              description: 'Essential for balancing pressing movements and preventing anterior shoulder impingement',
              defaultUnit: 'kg',
              metrics: { trackWeight: true, trackReps: true }
            },
            sets: [
              { reps: 8, weight: Math.max(30, avgIntensity * 0.7), difficulty: DifficultyCategory.NORMAL },
              { reps: 8, weight: Math.max(35, avgIntensity * 0.75), difficulty: DifficultyCategory.NORMAL },
              { reps: 6, weight: Math.max(40, avgIntensity * 0.8), difficulty: DifficultyCategory.HARD }
            ]
          }]
        });
      }

      // 2. Movement Pattern Completion
      if (!movementPatterns.hinge && (movementPatterns.squat || muscleGroups.legs)) {
        newSuggestions.push({
          id: 'hip-hinge-pattern',
          title: 'Hip Hinge Movement Pattern',
          description: 'Complete the fundamental movement patterns for comprehensive strength development',
          type: 'complementary',
          exercises: [{
            exercise: {
              id: 'romanian-deadlift',
              name: 'Romanian Deadlift',
              type: 'strength',
              category: 'compound',
              primaryMuscles: ['hamstrings', 'glutes'],
              secondaryMuscles: ['lower_back', 'traps'],
              instructions: ['Hip-hinge dominant', 'Keep bar close to body', 'Feel stretch in hamstrings'],
              description: 'Develops posterior chain strength and hip mobility - essential movement pattern',
              defaultUnit: 'kg',
              metrics: { trackWeight: true, trackReps: true }
            },
            sets: [
              { reps: 10, weight: Math.max(40, avgIntensity * 0.6), difficulty: DifficultyCategory.NORMAL },
              { reps: 8, weight: Math.max(50, avgIntensity * 0.7), difficulty: DifficultyCategory.NORMAL },
              { reps: 6, weight: Math.max(60, avgIntensity * 0.8), difficulty: DifficultyCategory.HARD }
            ]
          }]
        });
      }

      // 3. Core Stability Integration
      if (totalSets >= 4 && !muscleGroups.core) {
        newSuggestions.push({
          id: 'core-stability',
          title: 'Core Stability Foundation',
          description: 'Research shows core training improves force transfer and reduces injury risk by 35%',
          type: 'complementary',
          exercises: [{
            exercise: {
              id: 'dead-bug',
              name: 'Dead Bug',
              type: 'strength',
              category: 'isolation',
              primaryMuscles: ['core'],
              secondaryMuscles: ['shoulders'],
              instructions: ['Maintain lower back contact', 'Move opposite arm/leg', 'Control breathing'],
              description: 'Builds anti-extension core strength and improves movement coordination',
              defaultUnit: 'reps',
              metrics: { trackReps: true }
            },
            sets: [
              { reps: 5, weight: 0, difficulty: DifficultyCategory.EASY },
              { reps: 5, weight: 0, difficulty: DifficultyCategory.NORMAL },
              { reps: 5, weight: 0, difficulty: DifficultyCategory.NORMAL }
            ]
          }]
        });
      }

      // 4. Progressive Overload Techniques
      if (selectedExercises.length >= 3 && totalSets >= 8) {
        newSuggestions.push({
          id: 'intensity-technique',
          title: 'Progressive Overload Enhancement',
          description: 'Apply advanced training methods to stimulate further adaptation',
          type: 'progression',
          exercises: [{
            exercise: {
              id: 'drop-set-protocol',
              name: 'Drop Set Protocol',
              type: 'strength',
              category: 'isolation',
              primaryMuscles: ['full_body'],
              secondaryMuscles: [],
              instructions: ['Perform to technical failure', 'Reduce weight 20-30%', 'Continue immediately'],
              description: 'Increases metabolic stress and motor unit recruitment for enhanced hypertrophy',
              defaultUnit: 'kg',
              metrics: { trackWeight: true, trackReps: true }
            },
            sets: [
              { reps: 12, weight: Math.max(20, avgIntensity * 0.6), difficulty: DifficultyCategory.NORMAL },
              { reps: 8, weight: Math.max(15, avgIntensity * 0.45), difficulty: DifficultyCategory.HARD },
              { reps: 6, weight: Math.max(12, avgIntensity * 0.35), difficulty: DifficultyCategory.DROP }
            ]
          }]
        });
      }

      // 5. Mobility and Activation
      if (selectedExercises.length >= 4) {
        newSuggestions.push({
          id: 'movement-prep',
          title: 'Movement Preparation',
          description: 'Activate underactive muscles and improve movement quality for injury prevention',
          type: 'recovery',
          exercises: [{
            exercise: {
              id: 'band-pull-apart',
              name: 'Band Pull-Apart',
              type: 'strength',
              category: 'isolation',
              primaryMuscles: ['shoulders', 'back'],
              secondaryMuscles: ['traps'],
              instructions: ['Retract shoulder blades', 'Hold peak contraction', 'Control return phase'],
              description: 'Activates often-neglected posterior deltoids and mid-traps for shoulder health',
              defaultUnit: 'reps',
              metrics: { trackReps: true }
            },
            sets: [
              { reps: 5, weight: 0, difficulty: DifficultyCategory.EASY },
              { reps: 5, weight: 0, difficulty: DifficultyCategory.EASY }
            ]
          }]
        });
      }

      // 6. Unilateral Training
      const hasUnilateral = exerciseNames.some(name => 
        name.includes('single') || name.includes('unilateral') || 
        name.includes('lunge') || name.includes('step')
      );
      
      if (!hasUnilateral && selectedExercises.length >= 2) {
        newSuggestions.push({
          id: 'unilateral-strength',
          title: 'Unilateral Strength Development',
          description: 'Address strength imbalances and improve functional movement patterns',
          type: 'complementary',
          exercises: [{
            exercise: {
              id: 'bulgarian-split-squat',
              name: 'Bulgarian Split Squat',
              type: 'strength',
              category: 'compound',
              primaryMuscles: ['quadriceps', 'glutes'],
              secondaryMuscles: ['core', 'calves'],
              instructions: ['Maintain upright torso', 'Descend until back knee nearly touches', 'Drive through front heel'],
              description: 'Unilateral exercise that reveals and corrects strength imbalances between limbs',
              defaultUnit: 'kg',
              metrics: { trackWeight: true, trackReps: true }
            },
            sets: [
              { reps: 8, weight: Math.max(10, avgIntensity * 0.3), difficulty: DifficultyCategory.NORMAL },
              { reps: 8, weight: Math.max(15, avgIntensity * 0.35), difficulty: DifficultyCategory.NORMAL },
              { reps: 6, weight: Math.max(20, avgIntensity * 0.4), difficulty: DifficultyCategory.HARD }
            ]
          }]
        });
      }

      setSuggestions(newSuggestions);
      setLoading(false);
    }, 1500); // Slightly longer for more "AI thinking" feel
  };

  const getSuggestionTypeColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'complementary': return 'bg-blue-600';
      case 'progression': return 'bg-purple-600';
      case 'recovery': return 'bg-green-600';
      default: return 'bg-bg-tertiary';
    }
  };

  const getSuggestionTypeIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'complementary': return '⚖️';
      case 'progression': return '📈';
      case 'recovery': return '🧘';
      default: return '💡';
    }
  };

  if (selectedExercises.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-lg p-6 border border-border">
        <div className="text-center text-text-tertiary">
          <LightBulbIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Add exercises to see AI suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-lg p-6 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="w-5 h-5 text-blue-400" />
        <h3 className="text-text-primary font-medium">AI Session Suggestions</h3>
        {loading && (
          <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin ml-2"></div>
        )}
      </div>

      {loading ? (
        <div className="text-text-tertiary text-sm">
          Analyzing your workout...
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-text-tertiary text-sm">
          Your workout looks complete! 💪
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-bg-secondary rounded-lg p-4 border border-border"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{getSuggestionTypeIcon(suggestion.type)}</span>
                  <div>
                    <h4 className="text-text-primary font-medium text-sm">{suggestion.title}</h4>
                    <p className="text-text-tertiary text-xs">{suggestion.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs text-text-primary ${getSuggestionTypeColor(suggestion.type)}`}>
                  {suggestion.type}
                </span>
              </div>

              <div className="text-xs text-text-tertiary mb-3">
                Suggested exercises: {suggestion.exercises.map(item => item.exercise.name).join(', ')}
              </div>

              <button
                onClick={() => onAddSuggestion(suggestion.exercises)}
                className="w-full px-3 py-2 bg-blue-600 text-text-primary rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Add to Session
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AISuggestions;
