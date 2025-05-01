import { useState, useEffect } from 'react';

interface Stats {
  streak: number;
  wordsLearned: number;
  lastActive: string | null;
}

export function useStats() {
  const [stats, setStats] = useState<Stats>({
    streak: 0,
    wordsLearned: 0,
    lastActive: null
  });

  useEffect(() => {
    // Load stats from chrome.storage
    chrome.storage.local.get(['stats'], (result) => {
      if (result.stats) {
        setStats(result.stats);
      } else {
        // Initialize stats if not present
        const initialStats: Stats = {
          streak: 0,
          wordsLearned: 0,
          lastActive: null
        };
        chrome.storage.local.set({ stats: initialStats });
        setStats(initialStats);
      }
    });
  }, []);

  return stats;
} 