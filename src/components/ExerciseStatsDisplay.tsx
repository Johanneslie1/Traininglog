import React from 'react';
import { ExerciseSet } from '../types/sets';
import { ExerciseType, getExerciseTypeConfig } from '../config/exerciseTypes';
import { calculateExerciseSessionStats, formatStatsForDisplay } from '../utils/exerciseStatsCalculator';

interface ExerciseStatsDisplayProps {
  sets: ExerciseSet[];
  exerciseType: ExerciseType;
  exerciseName: string;
  showDetailed?: boolean;
  className?: string;
}

const ExerciseStatsDisplay: React.FC<ExerciseStatsDisplayProps> = ({
  sets,
  exerciseType,
  exerciseName,
  showDetailed = false,
  className = ''
}) => {
  const config = getExerciseTypeConfig(exerciseType);
  const stats = calculateExerciseSessionStats(sets, exerciseType);
  const formattedStats = formatStatsForDisplay(stats, exerciseType);

  if (sets.length === 0) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>
        No sets recorded
      </div>
    );
  }

  const renderQuickStats = () => {
    switch (exerciseType) {
      case 'strength':
        return (
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-text-secondary">
              {stats.totalSets} set{stats.totalSets !== 1 ? 's' : ''}
            </span>
            {stats.totalVolume && (
              <span className="text-blue-400">
                {stats.totalVolume.toLocaleString()} kg total
              </span>
            )}
            {stats.maxWeight && (
              <span className="text-green-400">
                {stats.maxWeight} kg max
              </span>
            )}
            {stats.averageRIR !== undefined && (
              <span className="text-text-secondary">
                RIR {stats.averageRIR.toFixed(1)}
              </span>
            )}
          </div>
        );

      case 'plyometrics':
        return (
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-text-secondary">
              {stats.totalSets} set{stats.totalSets !== 1 ? 's' : ''}
            </span>
            {stats.maxReps && (
              <span className="text-blue-400">
                {stats.maxReps} reps max
              </span>
            )}
            {stats.totalVolume && (
              <span className="text-green-400">
                {stats.totalVolume} cm max height
              </span>
            )}
            {stats.averageRPE !== undefined && (
              <span className="text-text-secondary">
                RPE {stats.averageRPE.toFixed(1)}
              </span>
            )}
          </div>
        );

      case 'endurance':
      case 'teamSports':
      case 'other':
        return (
          <div className="flex flex-wrap gap-4 text-sm">
            {stats.totalDuration && (
              <span className="text-blue-400">
                {Math.floor(stats.totalDuration / 60)}h {(stats.totalDuration % 60).toFixed(0)}m
              </span>
            )}
            {stats.totalDistance && (
              <span className="text-green-400">
                {stats.totalDistance.toFixed(2)} km
              </span>
            )}
            {stats.enduranceMetrics?.averagePace && (
              <span className="text-purple-400">
                {Math.floor(stats.enduranceMetrics.averagePace)}:{Math.floor((stats.enduranceMetrics.averagePace % 1) * 60).toString().padStart(2, '0')}/km
              </span>
            )}
            {stats.averageRPE !== undefined && (
              <span className="text-text-secondary">
                RPE {stats.averageRPE.toFixed(1)}
              </span>
            )}
          </div>
        );

      case 'flexibility':
        return (
          <div className="flex flex-wrap gap-4 text-sm">
            {stats.totalDuration && (
              <span className="text-blue-400">
                {stats.totalDuration.toFixed(0)} minutes
              </span>
            )}
            <span className="text-text-secondary">
              {stats.totalSets} stretch{stats.totalSets !== 1 ? 'es' : ''}
            </span>
          </div>
        );

      default:
        return (
          <div className="text-text-secondary text-sm">
            {stats.totalSets} set{stats.totalSets !== 1 ? 's' : ''}
          </div>
        );
    }
  };

  const renderDetailedStats = () => {
    return (
      <div className="mt-4 space-y-3">
        {/* Basic Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(formattedStats).map(([key, value]) => (
            <div key={key} className="bg-bg-tertiary rounded-lg p-3">
              <div className="text-xs text-gray-400 uppercase tracking-wide">{key}</div>
              <div className="text-lg font-semibold text-text-primary">{value}</div>
            </div>
          ))}
        </div>

        {/* HR Zone Distribution for endurance activities */}
        {(exerciseType === 'endurance' || exerciseType === 'teamSports' || exerciseType === 'other') && 
         stats.totalHRZoneTime && (
          <div className="bg-bg-tertiary rounded-lg p-4">
            <h4 className="text-sm font-medium text-text-primary mb-3">Heart Rate Zone Distribution</h4>
            <div className="space-y-2">
              {[
                { zone: 'zone1', color: 'bg-blue-500', name: 'Zone 1 (Recovery)' },
                { zone: 'zone2', color: 'bg-green-500', name: 'Zone 2 (Aerobic)' },
                { zone: 'zone3', color: 'bg-yellow-500', name: 'Zone 3 (Threshold)' }
              ].map(({ zone, color, name }) => {
                const time = stats.totalHRZoneTime![zone as keyof typeof stats.totalHRZoneTime];
                const totalTime = stats.totalHRZoneTime!.zone1 + stats.totalHRZoneTime!.zone2 + stats.totalHRZoneTime!.zone3;
                const percentage = totalTime > 0 ? (time / totalTime) * 100 : 0;
                
                return (
                  <div key={zone} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">{name}</span>
                        <span className="text-text-primary">{time.toFixed(0)}m ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${color}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual Sets */}
        <div className="bg-bg-tertiary rounded-lg p-4">
          <h4 className="text-sm font-medium text-text-primary mb-3">
            Individual {exerciseType === 'strength' || exerciseType === 'plyometrics' ? 'Sets' : 'Sessions'}
          </h4>
          <div className="space-y-2">
            {sets.map((set, index) => (
              <div key={index} className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-b-0">
                <span className="text-gray-400">
                  {exerciseType === 'strength' || exerciseType === 'plyometrics' ? `Set ${index + 1}` : `Session ${index + 1}`}
                </span>
                <div className="flex gap-4 text-text-primary">
                  {renderSetDetails(set, exerciseType)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSetDetails = (set: ExerciseSet, type: ExerciseType) => {
    const details: JSX.Element[] = [];

    switch (type) {
      case 'strength':
        if (set.weight && set.reps) {
          details.push(<span key="weight-reps">{set.weight}kg × {set.reps}</span>);
        }
        if (set.rir !== undefined) {
          details.push(<span key="rir" className="text-text-secondary">RIR {set.rir}</span>);
        }
        break;      case 'plyometrics':
        if (set.reps) {
          details.push(<span key="reps">{set.reps} reps</span>);
        }
        if (set.height) {
          details.push(<span key="height">{set.height}cm</span>);
        }
        if (set.rpe) {
          details.push(<span key="rpe" className="text-text-secondary">RPE {set.rpe}</span>);
        }
        break;

      case 'speedAgility':
        if (set.reps) {
          details.push(<span key="reps">{set.reps} reps</span>);
        }
        if (set.duration) {
          details.push(<span key="duration">{set.duration}s</span>);
        }
        if (set.distance) {
          details.push(<span key="distance">{set.distance}m</span>);
        }
        if (set.height) {
          details.push(<span key="height">{set.height}cm</span>);
        }
        if (set.intensity) {
          details.push(<span key="intensity" className="text-blue-400">Intensity {set.intensity}</span>);
        }
        if (set.rpe) {
          details.push(<span key="rpe" className="text-text-secondary">RPE {set.rpe}</span>);
        }
        if (set.restTime) {
          details.push(<span key="rest">{set.restTime}s rest</span>);
        }
        break;

      case 'endurance':
      case 'teamSports':
      case 'other':
        if (set.duration) {
          details.push(<span key="duration">{set.duration}min</span>);
        }
        if (set.distance) {
          details.push(<span key="distance">{set.distance}km</span>);
        }
        if (set.rpe) {
          details.push(<span key="rpe" className="text-text-secondary">RPE {set.rpe}</span>);
        }
        break;

      case 'flexibility':
        if (set.duration) {
          details.push(<span key="duration">{set.duration}min</span>);
        }
        if (set.stretchType) {
          details.push(<span key="stretch">{set.stretchType}</span>);
        }
        if (set.intensity) {
          details.push(<span key="intensity" className="text-text-secondary">Intensity {set.intensity}</span>);
        }
        break;
    }

    return details.length > 0 ? details : [<span key="no-data">No data</span>];
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs text-text-primary ${config.color}`}>
            {config.icon}
          </span>
          <h3 className="font-medium text-text-primary">{exerciseName}</h3>
        </div>
        <span className="text-xs text-gray-400">{config.displayName}</span>
      </div>
      
      {renderQuickStats()}
      
      {showDetailed && renderDetailedStats()}
    </div>
  );
};

export default ExerciseStatsDisplay;

