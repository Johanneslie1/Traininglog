import { useState, useEffect } from 'react';
import { Query, onSnapshot } from 'firebase/firestore';

interface UseCollectionResult<T> {
  documents: T[] | null;
  error: Error | null;
  loading: boolean;
}

export function useCollection<T>(query: Query): UseCollectionResult<T> {
  const [documents, setDocuments] = useState<T[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const results: T[] = [];
        snapshot.forEach((doc) => {
          results.push({ ...(doc.data() as T), id: doc.id });
        });
        setDocuments(results);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching collection:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { documents, error, loading };
}
