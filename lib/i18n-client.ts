'use client';

import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  STORAGE_KEY,
  type Language,
} from './i18n-config';
import { detectLanguageFromLocation } from './i18n-location';

export type { Language };

export interface Translation {
  [key: string]: string;
}

type TParams = Record<string, string | number>;

class I18n {
  private translations: Record<string, Translation> = {};
  private currentLanguage: Language = DEFAULT_LANGUAGE;
  private loaded = false;
  private version = 0;
  private loadListeners = new Set<() => void>();
  private changeListeners = new Set<() => void>();
  private initialized = false;

  constructor() {
    // Don't auto-initialize - will be initialized lazily on first access
  }

  public ensureInitialized() {
    if (this.initialized) return;

    if (typeof window !== 'undefined') {
      this.initialized = true;
      this.loadTranslations();

      // Defer client language detection so initial client hydration matches server snapshot
      setTimeout(() => {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved && (LANGUAGES as readonly string[]).includes(saved as Language)) {
            this.setLanguage(saved as Language);
          } else {
            const detected = detectLanguageFromLocation();
            if (detected !== this.currentLanguage) {
              this.setLanguage(detected);
            }
          }
        } catch {
          /* storage unavailable */
        }
      }, 0);
    }
  }

  private applyDocumentLanguage(language: Language): void {
    try {
      document.documentElement.lang = language;
    } catch {
      /* server */
    }
  }

  private async loadTranslations(): Promise<void> {
    try {
      // Only load on client side
      if (typeof window === 'undefined') {
        this.loaded = true;
        this.notifyLoad();
        return;
      }

      // Client-side: Try to load from localStorage first
      try {
        const cached = localStorage.getItem('i18n_translations');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            this.translations = parsed;
            this.loaded = true;
            this.version += 1;
            this.notifyLoad();
            this.notifyChange();
            // Still fetch in background to update cache
            this.fetchAndCacheTranslations();
            return;
          }
        }
      } catch {
        /* storage unavailable */
      }

      await this.fetchAndCacheTranslations();
    } catch (error) {
      console.error('Failed to load translations:', error);
    } finally {
      this.loaded = true;
      this.version += 1;
      this.notifyLoad();
      this.notifyChange();
    }
  }

  private async fetchAndCacheTranslations(): Promise<void> {
    try {
      const responses = await Promise.all(
        LANGUAGES.map((code) =>
          fetch(`/locales/${code}.json`)
            .then((response) => (response.ok ? response.json() : {}))
            .catch(() => ({}))
        )
      );

      responses.forEach((dict, index) => {
        this.translations[LANGUAGES[index]] =
          dict && typeof dict === 'object' ? (dict as Translation) : {};
      });

      // Cache in localStorage
      try {
        localStorage.setItem('i18n_translations', JSON.stringify(this.translations));
      } catch {
        /* storage unavailable */
      }
    } catch (error) {
      console.error('Failed to fetch translations:', error);
    }
  }

  private notifyLoad(): void {
    this.loadListeners.forEach((fn) => fn());
    this.loadListeners.clear();
  }

  private notifyChange(): void {
    this.changeListeners.forEach((fn) => fn());
  }

  private interpolate(text: string, params?: TParams): string {
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (match, key: string) =>
      params[key] !== undefined && params[key] !== null ? String(params[key]) : match
    );
  }

  /**
   * Resolve a translation key. Fallback chain:
   * current language -> default language (nl) -> fallback argument -> key.
   */
  public t(id: string, fallback?: string, params?: TParams): string {
    this.ensureInitialized();
    const text =
      this.translations[this.currentLanguage]?.[id] ??
      this.translations[DEFAULT_LANGUAGE]?.[id] ??
      fallback ??
      id;
    return this.interpolate(text, params);
  }

  /**
   * Check if a translation key exists in the current language
   */
  public hasTranslation(id: string): boolean {
    return !!this.translations[this.currentLanguage]?.[id];
  }

  public setLanguage(language: Language): void {
    if (!(LANGUAGES as readonly string[]).includes(language)) {
      return;
    }
    this.currentLanguage = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* storage unavailable */
    }
    this.applyDocumentLanguage(language);
    this.version += 1;
    this.notifyChange();
  }

  public getCurrentLanguage(): Language {
    this.ensureInitialized();
    return this.currentLanguage;
  }

  public isLoaded(): boolean {
    this.ensureInitialized();
    return this.loaded;
  }

  /** Subscribe to language changes. Returns an unsubscribe function. */
  public subscribe = (callback: () => void): (() => void) => {
    this.ensureInitialized();
    this.changeListeners.add(callback);
    return () => {
      this.changeListeners.delete(callback);
    };
  };

  /** Snapshot used by useSyncExternalStore; changes whenever the language does. */
  public getSnapshot = (): number => {
    this.ensureInitialized();
    return this.version;
  };

  /** Register a callback for when the dictionary finishes loading. */
  public onLoaded(callback: () => void): () => void {
    this.ensureInitialized();
    if (this.loaded) {
      callback();
      return () => {};
    }
    this.loadListeners.add(callback);
    return () => {
      this.loadListeners.delete(callback);
    };
  }
}

// Lazy singleton - only instantiated when first accessed
let i18nInstance: I18n | null;

export function getI18n(): I18n {
  if (!i18nInstance) {
    i18nInstance = new I18n();
  }
  return i18nInstance;
}

// Export an alias for backward compatibility
export const i18n = getI18n;
