import { DEFAULT_LANGUAGE, type Language } from './i18n-config';

export type { Language };

export interface Translation {
  [key: string]: string;
}

type TParams = Record<string, string | number>;

// Server-side mock i18n - used during SSR
class ServerI18n {
  private currentLanguage: Language = DEFAULT_LANGUAGE;

  t(id: string, fallback?: string, params?: TParams): string {
    if (!params) return fallback ?? id;
    let text = fallback ?? id;
    return text.replace(/\{(\w+)\}/g, (match, key) =>
      params[key] !== undefined && params[key] !== null ? String(params[key]) : match
    );
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  setLanguage(): void {
    // No-op on server
  }

  subscribe(): () => void {
    return () => {};
  }

  getSnapshot(): number {
    return 0;
  }

  isLoaded(): boolean {
    return true;
  }

  onLoaded(callback: () => void): () => void {
    callback();
    return () => {};
  }
}

export const i18n = new ServerI18n();
