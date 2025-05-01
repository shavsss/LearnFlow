import { useState, useEffect } from 'react';
import { dbIDB, WordRow } from '@/indexdb/dexie';
import { liveQuery } from 'dexie';

interface UseVocabularyResult {
  words: WordRow[];
  loading: boolean;
  error: Error | null;
}

export function useVocabulary(limit = 50): UseVocabularyResult {
  const [words, setWords] = useState<WordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const subscription = liveQuery(() => 
      dbIDB.words.orderBy('ts').reverse().limit(limit).toArray()
    ).subscribe({
      next: (result) => {
        setWords(result);
        setLoading(false);
      },
      error: (err) => {
        console.error('Error loading vocabulary:', err);
        setError(err);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [limit]);

  return { words, loading, error };
}