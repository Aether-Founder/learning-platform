'use client';

import { useState, useEffect } from 'react';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

const STORAGE_KEY = 'search_history';
const MAX_HISTORY = 20;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
    };

    // Remove duplicates and add new item to front
    const newHistory = [
      newItem,
      ...history.filter((item) => item.query.toLowerCase() !== query.toLowerCase()),
    ].slice(0, MAX_HISTORY);

    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const removeFromHistory = (query: string) => {
    const newHistory = history.filter((item) => item.query !== query);
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
