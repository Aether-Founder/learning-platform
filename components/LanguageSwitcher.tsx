'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { LANGUAGE_REGISTRY } from '@/lib/i18n-config';

export function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, translationsReady } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!translationsReady) {
    return null;
  }

  const currentLang = LANGUAGE_REGISTRY.find((lang) => lang.code === currentLanguage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border hover:bg-secondary transition-colors"
        title={currentLang?.nativeName}
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang?.nativeName}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg z-20 min-w-[140px]">
            {LANGUAGE_REGISTRY.map((language) => (
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
                {language.nativeName}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
