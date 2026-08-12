'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReadingProgress {
  paragraphId: string;
  percentage: number;
  timestamp: number;
}

export function useReadingProgress(pageId: string) {
  const storageKey = `reading-progress-${pageId}`;

  const [progress, setProgress] = useState<ReadingProgress | null>(null);

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch {
        console.error('Failed to parse reading progress');
      }
    }
  }, [storageKey]);

  // Save progress to localStorage
  const saveProgress = useCallback(
    (paragraphId: string, percentage: number) => {
      const newProgress: ReadingProgress = {
        paragraphId,
        percentage,
        timestamp: Date.now(),
      };
      setProgress(newProgress);
      localStorage.setItem(storageKey, JSON.stringify(newProgress));
    },
    [storageKey]
  );

  // Clear progress
  const clearProgress = useCallback(() => {
    setProgress(null);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { progress, saveProgress, clearProgress };
}
