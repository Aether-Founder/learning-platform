import { NL_FALLBACKS } from "./i18n-nl-fallbacks";

export type Language = 'en' | 'nl' | 'fr' | 'de' | 'es' | 'tr';

export interface Translation {
  [key: string]: string;
}

class I18n {
  private translations: Record<Language, Translation> = {} as Record<Language, Translation>;
  private currentLanguage: Language = 'nl';
  private loaded = false;
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadTranslations();
  }

  private async loadTranslations(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        this.translations.en = {};
        this.translations.nl = {};
        this.translations.fr = {};
        this.translations.de = {};
        this.translations.es = {};
        this.translations.tr = {};
        this.loaded = true;
        return;
      }

      // Load saved language from localStorage
      try {
        const savedLanguage = localStorage.getItem('language') as Language;
        if (savedLanguage && ['en', 'nl', 'fr', 'de', 'es', 'tr'].includes(savedLanguage)) {
          this.currentLanguage = savedLanguage;
        }
      } catch {}

      // Load all language files
      const [enResponse, nlResponse, frResponse, deResponse, esResponse, trResponse] = await Promise.all([
        fetch('/locales/en.csv'),
        fetch('/locales/nl.csv'),
        fetch('/locales/fr.csv'),
        fetch('/locales/de.csv'),
        fetch('/locales/es.csv'),
        fetch('/locales/tr.csv'),
      ]);

      this.translations.en = enResponse.ok
        ? this.parseCSV(await enResponse.text())
        : {};

      this.translations.nl = nlResponse.ok
        ? this.parseCSV(await nlResponse.text())
        : {};

      this.translations.fr = frResponse.ok
        ? this.parseCSV(await frResponse.text())
        : {};

      this.translations.de = deResponse.ok
        ? this.parseCSV(await deResponse.text())
        : {};

      this.translations.es = esResponse.ok
        ? this.parseCSV(await esResponse.text())
        : {};

      this.translations.tr = trResponse.ok
        ? this.parseCSV(await trResponse.text())
        : {};

    } catch (error) {
      console.error('Failed to load translations:', error);
      this.translations.en = {};
      this.translations.nl = {};
      this.translations.fr = {};
      this.translations.de = {};
      this.translations.es = {};
      this.translations.tr = {};
    } finally {
      this.loaded = true;
      this.listeners.forEach((fn) => fn());
      this.listeners = [];
    }
  }

  private parseCSV(csvText: string): Translation {
    const lines = csvText.split('\n');
    const translations: Translation = {};
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [id, ...textParts] = line.split(',');
        const text = textParts.join(',').replace(/"/g, '').trim();
        if (id && text) {
          translations[id.trim()] = text;
        }
      }
    }
    return translations;
  }

  public onLoaded(fn: () => void): void {
    if (this.loaded) {
      fn();
    } else {
      this.listeners.push(fn);
    }
  }

  public setLanguage(language: Language): void {
    if (!['en', 'nl', 'fr', 'de', 'es', 'tr'].includes(language)) {
      return;
    }
    this.currentLanguage = language;
    try {
      localStorage.setItem('language', language);
    } catch {}
    this.listeners.forEach((fn) => fn());
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  public t(id: string, fallback?: string): string {
    const translation = this.translations[this.currentLanguage]?.[id];
    const nlFallback = NL_FALLBACKS[id];
    return translation || nlFallback || fallback || id;
  }

  public isLoaded(): boolean {
    return this.loaded;
  }
}

// Singleton
export const i18n = new I18n();

// Hook for React components
export function useTranslation() {
  const [translationsReady, setTranslationsReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('nl');

  useEffect(() => {
    i18n.onLoaded(() => {
      setTranslationsReady(true);
      setCurrentLanguage(i18n.getCurrentLanguage());
    });
  }, []);

  const changeLanguage = useCallback((language: Language) => {
    i18n.setLanguage(language);
    setCurrentLanguage(language);
  }, []);

  const t = useCallback(
    (id: string, fallback?: string) => i18n.t(id, fallback),
    [currentLanguage]
  );

  return { t, currentLanguage, changeLanguage, translationsReady };
}

import { useState, useEffect, useCallback } from 'react';
