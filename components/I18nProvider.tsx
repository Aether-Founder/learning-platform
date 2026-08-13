'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { setDateFormatLocale } from '@/lib/i18n-date';

/**
 * Gating provider for the i18n system.
 *
 * It waits until the translation dictionaries are loaded before rendering the
 * app, so the UI is never rendered in the wrong language and no hydration
 * mismatches occur. It also keeps <html lang> and the document title in sync.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { t, currentLanguage, translationsReady } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    setDateFormatLocale(currentLanguage);
    document.title = t('meta_title', 'Aether');
  }, [currentLanguage, t]);

  if (!translationsReady) {
    return <div className="min-h-screen bg-background" aria-hidden="true" />;
  }

  return <>{children}</>;
}
