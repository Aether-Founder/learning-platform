'use client';

import { useEffect, useState } from 'react';
import type { Language } from './i18n-config';

type TParams = Record<string, string | number>;

export function useTranslation() {
  const [i18nInstance, setI18nInstance] = useState<any>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('nl');
  const [translationsReady, setTranslationsReady] = useState(false);

  useEffect(() => {
    // Only import i18n on client side
    if (typeof window !== 'undefined') {
      import('./i18n-client')
        .then((module) => {
          const i18n = module.i18n();
          setI18nInstance(i18n);
          setCurrentLanguage(i18n.getCurrentLanguage());
          setTranslationsReady(i18n.isLoaded());
        })
        .catch((err) => {
          console.error('Failed to load i18n:', err);
        });
    }
  }, []);

  // Subscribe to language changes
  useEffect(() => {
    if (!i18nInstance) return;
    const unsubscribe = i18nInstance.subscribe(() => {
      setCurrentLanguage(i18nInstance.getCurrentLanguage());
    });
    return unsubscribe;
  }, [i18nInstance]);

  // Subscribe to load state
  useEffect(() => {
    if (!i18nInstance) return;
    const unsubscribe = i18nInstance.onLoaded(() => {
      setTranslationsReady(i18nInstance.isLoaded());
    });
    return unsubscribe;
  }, [i18nInstance]);

  const t = (id: string, fallback?: string, params?: TParams) => {
    if (!i18nInstance) return fallback ?? id;
    return i18nInstance.t(id, fallback, params);
  };
  const changeLanguage = (language: Language) => {
    if (i18nInstance) i18nInstance.setLanguage(language);
  };

  return { t, currentLanguage, changeLanguage, translationsReady };
}
