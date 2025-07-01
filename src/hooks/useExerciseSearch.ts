
import { useState, useEffect } from 'react';
import { Exercise } from '@/types/exercise';

export const useExerciseSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!searchTerm.trim()) {
      setFilteredExercises([]);
      return;
    }

    const fetchExercises = async () => {
      setLoading(true);
      try {
        // Local search: import allExercises from local data
        const { allExercises } = await import('@/data/exercises');
        // Add fake IDs if missing
        const exercisesWithId: Exercise[] = allExercises.map((ex, idx) => ({
          id: (ex as any).id || `${ex.name.replace(/\s+/g, '_').toLowerCase()}_${idx}`,
          ...ex
        }));
        const lower = searchTerm.toLowerCase();
        const results = exercisesWithId.filter(ex =>
          ex.name.toLowerCase().includes(lower) ||
          (ex.description && ex.description.toLowerCase().includes(lower))
        );
        if (isMounted) setFilteredExercises(results);
      } catch (err) {
        if (isMounted) setFilteredExercises([]);
        console.error('Error searching exercises:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const debounce = setTimeout(fetchExercises, 300);
    return () => {
      isMounted = false;
      clearTimeout(debounce);
    };
  }, [searchTerm]);
  
  return { searchTerm, setSearchTerm, filteredExercises, loading };
};
