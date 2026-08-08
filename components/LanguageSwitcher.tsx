'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation, Language } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { t, currentLanguage, changeLanguage, translationsReady } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!translationsReady) {
    return null;
  }

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: t('english') },
    { code: 'nl', name: t('dutch') },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'tr', name: 'Türkçe' },
  ];

  const currentLang = languages.find((lang) => lang.code === currentLanguage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border hover:bg-secondary transition-colors"
        title={t('language')}
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang?.name}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg z-20 min-w-[140px]">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  changeLanguage(language.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors text-left ${
                  currentLanguage === language.code
                    ? 'bg-secondary text-foreground'
                    : 'text-foreground'
                }`}
              >
                {language.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
