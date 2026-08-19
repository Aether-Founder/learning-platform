import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from './i18n-config';

export interface Translation {
  [key: string]: string;
}

const LOCALES_DIR = path.join(process.cwd(), 'public/locales');

/**
 * Server-side translation lookup for Server Components.
 *
 * The client i18n singleton stores the active language in localStorage, so it
 * is not available during server rendering. Server Components therefore resolve
 * the default language (nl) directly from the locale JSON files.
 */
export async function getServerT(language: Language = DEFAULT_LANGUAGE): Promise<ServerT> {
  const lang = (LANGUAGES as readonly string[]).includes(language) ? language : DEFAULT_LANGUAGE;
  let dict: Translation = {};
  
  try {
    const content = await fs.readFile(path.join(LOCALES_DIR, `${lang}.json`), 'utf-8');
    dict = JSON.parse(content);
  } catch {
    dict = {};
  }

  return (id: string, fallback?: string, params?: Record<string, string | number>): string => {
    let text = dict[id] ?? fallback ?? id;
    if (params) {
      text = text.replace(/\{(\w+)\}/g, (match, key) =>
        params[key] !== undefined && params[key] !== null ? String(params[key]) : match
      );
    }
    return text;
  };
}

export type ServerT = (id: string, fallback?: string, params?: Record<string, string | number>) => string;
