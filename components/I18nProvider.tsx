'use client';

import { useEffect, useState } from 'react';
import { setDateFormatLocale } from '@/lib/i18n-date';

/**
 * Gating provider for the i18n system.
 *
 * It waits until the translation dictionaries are loaded before rendering the
 * app, so the UI is never rendered in the wrong language and no hydration
 * mismatches occur. It also keeps <html lang> and the document title in sync.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);
  const [i18nInstance, setI18nInstance] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    
    // Lazy load i18n only on client
    import('@/lib/i18n-client')
      .then((module) => {
        const i18n = module.i18n();
        setI18nInstance(i18n);
        setI18nReady(i18n.isLoaded());
      })
      .catch((err) => {
        console.error('Failed to load i18n:', err);
      });
  }, []);

  useEffect(() => {
    if (mounted && i18nReady && i18nInstance) {
      const currentLanguage = i18nInstance.getCurrentLanguage();
      document.documentElement.lang = currentLanguage;
      document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
      setDateFormatLocale(currentLanguage);
      document.title = i18nInstance.t('meta_title', 'Aether');
    }
  }, [mounted, i18nReady, i18nInstance]);

  // Don't render children until mounted on client and i18n is ready
  if (!mounted || !i18nReady) {
    return null;
  }

  return <>{children}</>;
}

