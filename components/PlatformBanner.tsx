'use client';

import React, { useState, useEffect } from 'react';
import { getErrorMessage, readStoredJson, writeStoredJson } from '@/lib/errors';
import { logger } from '@/lib/logger';

// ============================================================
// CONFIGURABLE LOGO SIZES (change these values to adjust logos)
// ============================================================
const QUIZLET_LOGO_WIDTH = 120; // px – width of the Quizlet logo image
const QUIZLET_LOGO_HEIGHT = 48; // px – height of the Quizlet logo image
const STUDYGO_LOGO_WIDTH = 540; // px – width of the StudyGo logo image
const STUDYGO_LOGO_HEIGHT = 132; // px – height of the StudyGo logo image
// ============================================================

const STORAGE_KEY = 'platformBanner_hidden';
const ONBOARDING_KEY = 'platformBanner_onboarding_shown';

type HiddenState = {
  quizlet: boolean;
  studygo: boolean;
};

function loadHidden(): HiddenState {
  return readStoredJson<HiddenState>(STORAGE_KEY, { quizlet: false, studygo: false });
}

function saveHidden(state: HiddenState) {
  writeStoredJson(STORAGE_KEY, state);
}

export default function PlatformBanner() {
  const [hidden, setHidden] = useState<HiddenState>({
    quizlet: false,
    studygo: false,
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHidden(loadHidden());
    setMounted(true);
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) {
        setShowOnboarding(true);
      }
    } catch (error) {
      logger.warn('Could not read onboarding state', { reason: getErrorMessage(error) });
    }
  }, []);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      logger.warn('Could not persist onboarding state', { reason: getErrorMessage(error) });
    }
  };

  const hide = (platform: keyof HiddenState) => {
    const next = { ...hidden, [platform]: true };
    setHidden(next);
    saveHidden(next);
  };

  if (!mounted) return null;

  return (
    <>
      {showOnboarding && !hidden.studygo && !hidden.quizlet && (
        <div className="fixed bottom-28 right-4 z-50 w-[320px] rounded-2xl border border-border bg-secondary text-foreground shadow-2xl p-4 text-sm leading-6 transition-opacity duration-500">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-2">Tip voor toetsweek</p>
              <p className="text-sm text-muted-foreground">
                Klik op de <span className="font-semibold text-foreground">Quizlet</span> of{' '}
                <span className="font-semibold text-foreground">StudyGo</span> knop om direct naar
                de klas/groep te gaan met alle lijsten van termen en definities voor de komende
                toetsweek.
              </p>
            </div>
            <button
              onClick={dismissOnboarding}
              className="text-muted-foreground hover:text-foreground text-lg leading-none flex-shrink-0"
              aria-label="Sluit tip"
            >
              ×
            </button>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="relative flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 shadow-sm animate-pulse" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 border-x-[10px] border-x-transparent border-t-[12px] border-t-primary" />
            </div>
          </div>
        </div>
      )}

      {/* StudyGo Button */}
      {!hidden.studygo && (
        <a
          href="https://studygo.com/nl/learn/groups/435618/join?key=0c3cdb9"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            hide('studygo');
            window.open('https://studygo.com/nl/learn/groups/435618/join?key=0c3cdb9', '_blank');
          }}
          className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-32 h-10 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-md"
          style={{
            backgroundColor: '#652FA5',
            border: '2px solid #652FA5',
          }}
        >
          <img
            src="https://www-media.studygo.com/wp-content/uploads/2025/06/studygo-logo.png"
            alt="StudyGo"
            style={{
              width: STUDYGO_LOGO_WIDTH,
              height: STUDYGO_LOGO_HEIGHT,
              objectFit: 'contain',
            }}
          />
        </a>
      )}

      {/* Quizlet Button */}
      {!hidden.quizlet && (
        <a
          href="https://quizlet.com/join/Ea8jPMrnR?i=75vmk8&x=1bqt"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            hide('quizlet');
            window.open('https://quizlet.com/join/Ea8jPMrnR?i=75vmk8&x=1bqt', '_blank');
          }}
          className="fixed bottom-4 right-40 z-50 flex items-center justify-center w-32 h-10 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-md"
          style={{
            backgroundColor: '#5758FF',
            border: '2px solid #5758FF',
          }}
        >
          <img
            src="https://github.com/DUB55/light-learning-platform/blob/main/quizlet%20logo_converted.jpg?raw=true"
            alt="Quizlet"
            style={{
              width: QUIZLET_LOGO_WIDTH,
              height: QUIZLET_LOGO_HEIGHT,
              objectFit: 'contain',
            }}
          />
        </a>
      )}
    </>
  );
}
