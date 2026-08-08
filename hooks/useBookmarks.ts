'use client';

import { useState, useEffect, useCallback } from 'react';

interface Bookmark {
  paragraphId: string;
  title: string;
  timestamp: number;
}

export function useBookmarks(pageId: string) {
  const storageKey = `bookmarks-${pageId}`;

  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [bookmarkList, setBookmarkList] = useState<Bookmark[]>([]);

  // Load saved bookmarks on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: Bookmark[] = JSON.parse(saved);
        setBookmarkList(parsed);
        setBookmarks(new Set(parsed.map((b) => b.paragraphId)));
      } catch {
        console.error('Failed to parse bookmarks');
      }
    }
  }, [storageKey]);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    if (bookmarkList.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(bookmarkList));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [bookmarkList, storageKey]);

  // Add bookmark
  const addBookmark = useCallback((paragraphId: string, title: string) => {
    setBookmarks((prev) => new Set([...prev, paragraphId]));
    setBookmarkList((prev) => {
      const filtered = prev.filter((b) => b.paragraphId !== paragraphId);
      return [
        ...filtered,
        {
          paragraphId,
          title,
          timestamp: Date.now(),
        },
      ];
    });
  }, []);

  // Remove bookmark
  const removeBookmark = useCallback((paragraphId: string) => {
    setBookmarks((prev) => {
      const newSet = new Set(prev);
      newSet.delete(paragraphId);
      return newSet;
    });
    setBookmarkList((prev) => prev.filter((b) => b.paragraphId !== paragraphId));
  }, []);

  // Toggle bookmark
  const toggleBookmark = useCallback(
    (paragraphId: string, title: string) => {
      if (bookmarks.has(paragraphId)) {
        removeBookmark(paragraphId);
      } else {
        addBookmark(paragraphId, title);
      }
    },
    [bookmarks, addBookmark, removeBookmark]
  );

  // Check if bookmarked
  const isBookmarked = useCallback(
    (paragraphId: string) => bookmarks.has(paragraphId),
    [bookmarks]
  );

  // Clear all bookmarks
  const clearBookmarks = useCallback(() => {
    setBookmarks(new Set());
    setBookmarkList([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    bookmarks,
    bookmarkList,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    clearBookmarks,
  };
}
