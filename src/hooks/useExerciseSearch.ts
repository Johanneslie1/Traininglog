import { useState, useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { getExerciseSuggestions } from '@/services/firebase/exercises';

export const useExerciseSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredExercises([]);
      return;
    }
    
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const results = await getExerciseSuggestions(searchTerm);
        setFilteredExercises(results);
      } catch (err) {
        console.error('Error searching exercises:', err);
      } finally {
        setLoading(false);
      }
    };
    
    const debounce = setTimeout(fetchExercises, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);
  
  return { searchTerm, setSearchTerm, filteredExercises, loading };
};
