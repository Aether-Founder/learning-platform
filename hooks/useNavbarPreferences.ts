/**
 * Hook for managing navbar visibility preferences
 */

'use client';

import { useEffect, useState } from 'react';
import { useUser } from './useAuth';

export type NavPage =
  | 'dashboard'
  | 'subjects'
  | 'decks'
  | 'notes'
  | 'groups'
  | 'agenda'
  | 'artisan'
  | 'inbox'
  | 'foutenlogboek'
  | 'planner'
  | 'settings'
  | 'vandaag'
  | 'admin';

export interface NavVisibility {
  [key: string]: boolean;
}

const DEFAULT_VISIBILITY: NavVisibility = {
  dashboard: false,
  subjects: true,
  decks: false,
  notes: true,
  groups: false,
  agenda: true,
  artisan: true,
  inbox: false,
  foutenlogboek: false,
  planner: false,
  settings: false,
  vandaag: false,
  admin: false,
};

const PAGE_LABELS: Record<NavPage, string> = {
  dashboard: 'Overzicht',
  subjects: 'Vakken',
  decks: 'Leersets',
  notes: 'Notities',
  groups: 'Groepen',
  agenda: 'Agenda',
  artisan: 'Artisan',
  inbox: 'Inbox',
  foutenlogboek: 'Foutenlogboek',
  planner: 'Planner',
  settings: 'Instellingen',
  vandaag: 'Vandaag',
  admin: 'Admin',
};

const PAGE_HREFS: Record<NavPage, string> = {
  dashboard: '/',
  subjects: '/vakken',
  decks: '/leersets',
  notes: '/notities',
  groups: '/groepen',
  agenda: '/agenda',
  artisan: '/artisan',
  inbox: '/inbox',
  foutenlogboek: '/foutenlogboek',
  planner: '/planner',
  settings: '/instellingen',
  vandaag: '/vandaag',
  admin: '/admin',
};

export function useNavbarPreferences() {
  const { user } = useUser();
  const [visibility, setVisibility] = useState<NavVisibility>(DEFAULT_VISIBILITY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = () => {
      const key = user ? `navbar-visibility:${user.id}` : 'navbar-visibility:guest';
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          setVisibility({ ...DEFAULT_VISIBILITY, ...parsed });
        }
      } catch (error) {
        console.error('Failed to load navbar preferences:', error);
      }
      setLoading(false);
    };

    loadPreferences();
  }, [user]);

  const toggleVisibility = (page: NavPage) => {
    const newVisibility = { ...visibility, [page]: !visibility[page] };
    setVisibility(newVisibility);

    const key = user ? `navbar-visibility:${user.id}` : 'navbar-visibility:guest';
    try {
      localStorage.setItem(key, JSON.stringify(newVisibility));
    } catch (error) {
      console.error('Failed to save navbar preferences:', error);
    }
  };

  const resetToDefaults = () => {
    setVisibility(DEFAULT_VISIBILITY);
    const key = user ? `navbar-visibility:${user.id}` : 'navbar-visibility:guest';
    try {
      localStorage.setItem(key, JSON.stringify(DEFAULT_VISIBILITY));
    } catch (error) {
      console.error('Failed to reset navbar preferences:', error);
    }
  };

  const getVisiblePages = (): NavPage[] => {
    return Object.entries(visibility)
      .filter(([_, visible]) => visible)
      .map(([page]) => page as NavPage);
  };

  return {
    visibility,
    toggleVisibility,
    resetToDefaults,
    getVisiblePages,
    loading,
    PAGE_LABELS,
    PAGE_HREFS,
  };
}
