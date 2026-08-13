'use client';

import { useSyncExternalStore } from 'react';
import { i18n, type Language } from './i18n';

type TParams = Record<string, string | number>;

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
