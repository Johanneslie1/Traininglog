import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Exercise } from '@/types/exercise';
// @ts-ignore - CSS Module
import styles from './StrengthExercisePicker.module.css';

interface StrengthExercisePickerProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  isLoading?: boolean;
  onCreateExercise?: () => void;
}

// Muscle group color mapping for subtle visual distinction
const getMuscleGroupColor = (muscle: string): string => {
  const colorMap: Record<string, string> = {
    'chest': '#ef4444',
    'back': '#f97316',
    'shoulders': '#eab308',
    'biceps': '#06b6d4',
    'triceps': '#06b6d4',
    'legs': '#10b981',
    'quadriceps': '#10b981',
    'hamstrings': '#10b981',
    'glutes': '#10b981',
    'calves': '#10b981',
    'forearms': '#8b5cf6',
    'core': '#ec4899',
    'traps': '#f97316',
    'lats': '#f97316',
    'lower_back': '#f97316',
    'full_body': '#6366f1',
  };
  return colorMap[muscle.toLowerCase()] || '#6b7280';
};

export const StrengthExercisePicker: React.FC<StrengthExercisePickerProps> = ({
  exercises,
  onSelect,
  onClose,
  isLoading = false,
  onCreateExercise,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Debounced search filtering
  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) return exercises;

    const term = searchTerm.toLowerCase();
    return exercises.filter(exercise => {
      const matchesName = exercise.name.toLowerCase().includes(term);
      const matchesMuscles = (exercise.primaryMuscles || []).some(m =>
        m.toLowerCase().includes(term)
      );
      return matchesName || matchesMuscles;
    });
  }, [searchTerm, exercises]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < filteredExercises.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredExercises[selectedIndex]) {
        onSelect(filteredExercises[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [filteredExercises, selectedIndex, onSelect, onClose]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = document.querySelector(
      `[data-exercise-index="${selectedIndex}"]`
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h2 className={styles.title}>Add Exercise</h2>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close"
        >
          <svg className={styles.closeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search exercises or muscles…"
            className={styles.searchInput}
            aria-label="Search exercises"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={styles.clearButton}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className={styles.listContainer}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading exercises…</p>
          </div>
        ) : filteredExercises.length > 0 ? (
          <div className={styles.list}>
            {filteredExercises.map((exercise, index) => {
              const primaryMuscle = (exercise.primaryMuscles || [])[0] || '';
              const muscleColor = getMuscleGroupColor(primaryMuscle);
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={exercise.id}
                  data-exercise-index={index}
                  onClick={() => onSelect(exercise)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`${styles.exerciseRow} ${isSelected ? styles.exerciseRowActive : ''}`}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* Accent bar */}
                  <div
                    className={styles.accentBar}
                    style={{ backgroundColor: muscleColor }}
                  />

                  {/* Content */}
                  <div className={styles.content}>
                    <h3 className={styles.exerciseName}>{exercise.name}</h3>
                    <p className={styles.exerciseCategory}>
                      {(exercise.primaryMuscles || []).join(', ') || 'General'}
                    </p>
                  </div>

                  {/* Chevron indicator */}
                  {isSelected && (
                    <svg className={styles.chevron} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L12.17 12z" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <p className={styles.emptyTitle}>No exercises found</p>
            <p className={styles.emptyText}>
              Try different search terms or create a custom exercise
            </p>
            {onCreateExercise && (
              <button
                onClick={onCreateExercise}
                className={styles.createButton}
              >
                <svg className={styles.createIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Create New Exercise
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {!isLoading && filteredExercises.length > 0 && (
        <footer className={styles.footer}>
          <p className={styles.hint}>
            Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select
          </p>
        </footer>
      )}
    </div>
  );
};

export default StrengthExercisePicker;
