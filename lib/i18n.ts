import { useSyncExternalStore } from 'react';
import { DEFAULT_LANGUAGE, LANGUAGES, STORAGE_KEY, type Language } from './i18n-config';
import { detectLanguageFromLocation } from './i18n-location';
import { fetchJson, getErrorMessage } from './errors';
import { logger } from './logger';

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

  constructor() {
    // Detect the language from the visitor's location synchronously on the
    // client so the first render already uses the right language (no flash of
    // the wrong one). NL and BE map to Dutch, everything else to English.
    if (typeof window !== 'undefined') {
      const detected = detectLanguageFromLocation();
      this.currentLanguage = detected;
      this.applyDocumentLanguage(detected);
    }
    this.loadTranslations();
  }

  private applyDocumentLanguage(language: Language): void {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = language;
  }

  private async loadTranslations(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        this.loaded = true;
        this.notifyLoad();
        return;
      }

      const responses = await Promise.all(
        LANGUAGES.map((code) =>
          fetchJson<Translation>(`/locales/${code}.json`).catch((error) => {
            logger.error('Failed to load locale file', error, { locale: code });
            return {} as Translation;
          })
        )
      );

      responses.forEach((dict, index) => {
        this.translations[LANGUAGES[index]] =
          dict && typeof dict === 'object' ? (dict as Translation) : {};
      });
    } catch (error) {
      logger.error('Failed to load translations', error);
    } finally {
      this.loaded = true;
      this.version += 1;
      this.notifyLoad();
      this.notifyChange();
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
    const text =
      this.translations[this.currentLanguage]?.[id] ??
      this.translations[DEFAULT_LANGUAGE]?.[id] ??
      fallback ??
      id;
    return this.interpolate(text, params);
  }

  public setLanguage(language: Language): void {
    if (!(LANGUAGES as readonly string[]).includes(language)) {
      return;
    }
    this.currentLanguage = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      logger.warn('Failed to persist language preference', { reason: getErrorMessage(error) });
    }
    this.applyDocumentLanguage(language);
    this.version += 1;
    this.notifyChange();
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  public isLoaded(): boolean {
    return this.loaded;
  }

  /** Subscribe to language changes. Returns an unsubscribe function. */
  public subscribe = (callback: () => void): (() => void) => {
    this.changeListeners.add(callback);
    return () => {
      this.changeListeners.delete(callback);
    };
  };

  /** Snapshot used by useSyncExternalStore; changes whenever the language does. */
  public getSnapshot = (): number => {
    return this.version;
  };

  /** Register a callback for when the dictionary finishes loading. */
  public onLoaded(callback: () => void): () => void {
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

// Singleton
export const i18n = new I18n();

// Hook for React components
export function useTranslation() {
  useSyncExternalStore(i18n.subscribe, i18n.getSnapshot, i18n.getSnapshot);
  const translationsReady = useSyncExternalStore(
    (callback) => i18n.onLoaded(callback),
    () => i18n.isLoaded(),
    () => i18n.isLoaded()
  );

  const t = (id: string, fallback?: string, params?: TParams) => i18n.t(id, fallback, params);
  const currentLanguage = i18n.getCurrentLanguage();
  const changeLanguage = (language: Language) => i18n.setLanguage(language);

  return { t, currentLanguage, changeLanguage, translationsReady };
}
