'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Brain,
  ChevronRight,
  ClipboardList,
  Gamepad2,
  List,
  Image as ImageIcon,
  Layers,
  PenLine,
  RotateCcw,
} from 'lucide-react';
import { buildStudySetFromSections } from '@/lib/learning-platform/study-set';
import { STUDY_GAMES, getGameById } from '@/lib/learning-platform/game-registry';
import { reviewForecast } from '@/lib/learning-platform/srs';
import { useLearningPlatformStore } from '@/store/useLearningPlatformStore';
import type { LearningMode } from '@/types/learning-platform';
import { useTranslation } from '@/lib/i18n';
import { SessionSettingsPanel } from './SessionSettingsPanel';
import { MasteryProgressBar } from './MasteryProgressBar';
import { TermList } from './TermList';
import { StudySetTools } from './StudySetTools';
import { LearnMode } from './modes/LearnMode';
import { TestMode } from './modes/TestMode';
import { EnhancedFlashcardMode } from './modes/EnhancedFlashcardMode';
import { McqOnlyMode } from './modes/McqOnlyMode';
import { WritingOnlyMode } from './modes/WritingOnlyMode';
import { RegisteredGameView } from './GameShell';

interface SourceSection {
  id: string;
  title: string | string[];
  titles?: string[];
  chapterTitles?: string[];
  paragraphs?: Array<{
    questions?: Array<{
      id: string;
      number?: string;
      question: string;
      answer: string;
    }>;
  }>;
  blocks?: Array<{
    type?: string;
    questions?: Array<{ id: string; text?: string; question?: string }>;
  }>;
  answers?: Array<{ questionId: string; answer: string }>;
}

interface LearningPlatformProps {
  pageId: string;
  sections: SourceSection[];
  enableImageLearning?: boolean;
  learningSet?: {
    title: string;
    terms: Array<{
      id: string;
      term: string;
      definition: string;
      image?: string;
    }>;
  };
}

type HubScreen = 'home' | 'leren-setup' | 'test-setup' | 'games' | 'terms' | 'playing';

function HubButton({
  label,
  description,
  icon,
  onClick,
}: {
  label: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors text-left group"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-base text-foreground">{label}</p>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground shrink-0" />
    </button>
  );
}

function LerenModeView() {
  return <LearnMode />;
}

function LerenMetAfbeeldingenView() {
  return <LearnMode useImages={true} />;
}

function StudyModeView({ mode }: { mode: LearningMode }) {
  if (getGameById(mode)) {
    return null;
  }
  if (mode === 'test') return <TestMode />;
  if (mode === 'learn-image') return <LerenMetAfbeeldingenView />;
  if (mode === 'flashcard' || mode === 'review') return <EnhancedFlashcardMode />;
  if (mode === 'multiple-choice-only') return <McqOnlyMode />;
  if (mode === 'writing-only') return <WritingOnlyMode />;
  return <LerenModeView />;
}

export function LearningPlatform({
  pageId,
  sections,
  enableImageLearning,
  learningSet: providedLearningSet,
}: LearningPlatformProps) {
  const { t } = useTranslation();
  const {
    init,
    studySet,
    activeMode,
    setActiveMode,
    refreshPlayableTerms,
    saveSettingsToStorage,
    initialized,
  } = useLearningPlatformStore();
  const [screen, setScreen] = useState<HubScreen>('home');

  useEffect(() => {
    let set;
    if (providedLearningSet) {
      // Convert provided learningSet to StudySet format
      const now = new Date();
      const terms = providedLearningSet.terms.map((item, index) => ({
        id: item.id || `term-${index}`,
        term: item.term,
        definition: item.definition,
        learningSetId: `set-${pageId}`,
        learningSetTitle: providedLearningSet.title,
        isStarred: false,
        masteryStatus: 'unstudied' as const,
        consecutiveCorrectCount: 0,
        createdAt: now,
        front: item.term,
        back: item.definition,
        cardType: 'basic' as const,
        tags: [],
        image: item.image,
      }));
      set = {
        id: `set-${pageId}`,
        title: providedLearningSet.title,
        description: `${terms.length} begrippen`,
        terms,
        learningSets: [],
        createdAt: now,
        updatedAt: now,
      };
    } else {
      set = buildStudySetFromSections(sections, pageId);
    }
    if (set) init(set);
    setScreen('home');
    setActiveMode(null);
    return () => setActiveMode(null);
  }, [pageId, sections, providedLearningSet, init, setActiveMode]);

  useEffect(() => {
    if (initialized) refreshPlayableTerms();
  }, [initialized, refreshPlayableTerms]);

  const startLeren = () => {
    useLearningPlatformStore.getState().updateSettings({ reviewMode: 'mix' });
    refreshPlayableTerms();
    saveSettingsToStorage();
    setActiveMode('learn');
    setScreen('playing');
  };

  const startTest = () => {
    useLearningPlatformStore.getState().updateSettings({ reviewMode: 'mix' });
    refreshPlayableTerms();
    saveSettingsToStorage();
    setActiveMode('test');
    setScreen('playing');
  };

  const startMode = (
    mode: LearningMode,
    reviewMode: 'due' | 'new' | 'mix' | 'mistakes' | 'starred' = 'mix'
  ) => {
    useLearningPlatformStore.getState().updateSettings({ reviewMode });
    refreshPlayableTerms();
    saveSettingsToStorage();
    setActiveMode(mode);
    setScreen('playing');
  };

  const startGame = (gameId: LearningMode) => {
    setActiveMode(gameId);
    setScreen('playing');
  };

  const goBackFromPlaying = () => {
    const mode = activeMode;
    setActiveMode(null);
    if (mode === 'test') setScreen('home');
    else if (mode && getGameById(mode)) setScreen('games');
    else setScreen('home');
  };

  const startLerenMetAfbeeldingen = () => {
    refreshPlayableTerms();
    saveSettingsToStorage();
    setActiveMode('learn-image');
    setScreen('playing');
  };

  if (!studySet) {
    return (
      <p className="text-center py-12 text-muted-foreground">
        {t('study_no_terms', 'Geen studiemateriaal gevonden op deze pagina.')}
      </p>
    );
  }

  const termCount = studySet.terms.length;
  const dueCount = studySet.terms.filter(
    (term) => !term.suspended && (!term.nextReviewAt || term.nextReviewAt.getTime() <= Date.now())
  ).length;
  const newCount = studySet.terms.filter((term) => (term.reviewCount ?? 0) === 0).length;
  const weakCount = studySet.terms.filter(
    (term) => (term.lapseCount ?? 0) > 0 || term.masteryStatus === 'learning'
  ).length;
  const forecast = reviewForecast(studySet.terms, 4);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-serif font-medium text-foreground">{studySet.title}</h2>
        <p className="text-sm text-muted-foreground">
          {termCount} {t('study_terms_count', 'begrippen')}
        </p>
      </div>

      <MasteryProgressBar terms={studySet.terms} />
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-lg font-semibold text-foreground">{dueCount}</p>
          <p className="text-[11px] text-muted-foreground">Due</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-lg font-semibold text-foreground">{newCount}</p>
          <p className="text-[11px] text-muted-foreground">Nieuw</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-lg font-semibold text-foreground">{weakCount}</p>
          <p className="text-[11px] text-muted-foreground">Zwak</p>
        </div>
      </div>

      {screen === 'playing' && activeMode ? (
        <div className="space-y-4">
          {getGameById(activeMode) ? (
            <RegisteredGameView gameId={activeMode} onQuit={goBackFromPlaying} />
          ) : (
            <>
              <button
                type="button"
                onClick={goBackFromPlaying}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('study_back', 'Terug')}
              </button>
              <StudyModeView key={activeMode} mode={activeMode} />
            </>
          )}
        </div>
      ) : screen === 'leren-setup' ? (
        <SessionSettingsPanel
          preset="leren"
          onBack={() => setScreen('home')}
          onStart={startLeren}
        />
      ) : screen === 'test-setup' ? (
        <SessionSettingsPanel preset="test" onBack={() => setScreen('home')} onStart={startTest} />
      ) : screen === 'terms' ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setScreen('home')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('study_back_home', 'Terug naar menu')}
          </button>
          <h3 className="text-lg font-medium text-center">
            {t('study_begrippenlijst', 'Begrippenlijst')}
          </h3>
          <StudySetTools />
          <TermList terms={studySet.terms} />
        </div>
      ) : screen === 'games' ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setScreen('home')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('study_back_home', 'Terug naar menu')}
          </button>
          <h3 className="text-lg font-medium text-center">{t('study_spelletjes', 'Spelletjes')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STUDY_GAMES.map((game) => {
              const Icon = game.icon;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => startGame(game.id)}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-background text-foreground shadow-sm group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className="text-sm font-medium text-center">
                    {t(game.labelKey, game.fallback)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center mb-4">
            {t('study_choose_activity', 'Kies wat je wilt doen')}
          </p>
          <HubButton
            label="Review"
            description={`${dueCount} kaarten klaar voor Anki-herhaling`}
            icon={<RotateCcw className="h-6 w-6" />}
            onClick={() => startMode('review', 'due')}
          />
          <HubButton
            label={t('study_leren', 'Leren')}
            description={t('study_leren_desc', 'Kies hoe je oefent en start meteen')}
            icon={<Brain className="h-6 w-6" />}
            onClick={() => setScreen('leren-setup')}
          />
          <HubButton
            label="Flashcards"
            description="Draai kaarten om en beoordeel met Again, Hard, Good of Easy"
            icon={<Layers className="h-6 w-6" />}
            onClick={() => startMode('flashcard', 'mix')}
          />
          <HubButton
            label="Schrijven"
            description="WRTS-training met typecontrole, foutenronde en slimme beoordeling"
            icon={<PenLine className="h-6 w-6" />}
            onClick={() => startMode('writing-only', 'mix')}
          />
          {enableImageLearning && (
            <HubButton
              label={t('study_leren_images', 'Leren (met afbeeldingen)')}
              description={t(
                'study_leren_images_desc',
                'Oefen met afbeeldingen en kies het juiste begrip'
              )}
              icon={<ImageIcon className="h-6 w-6" />}
              onClick={startLerenMetAfbeeldingen}
            />
          )}
          <HubButton
            label={t('study_oefentoets', 'Oefentoets')}
            description={t('study_oefentoets_desc', 'Stel je toets in en ontvang een score')}
            icon={<ClipboardList className="h-6 w-6" />}
            onClick={() => setScreen('test-setup')}
          />
          <HubButton
            label={t('study_spelletjes', 'Spelletjes')}
            description={t('study_spelletjes_desc', 'Leer spelenderwijs met minigames')}
            icon={<Gamepad2 className="h-6 w-6" />}
            onClick={() => setScreen('games')}
          />
          <HubButton
            label={t('study_begrippenlijst', 'Begrippenlijst')}
            description={`${t('study_begrippenlijst_desc', 'Bekijk begrippen en markeer met een ster')} · ${forecast.map((day) => day.count).join('/')}`}
            icon={<List className="h-6 w-6" />}
            onClick={() => setScreen('terms')}
          />
        </div>
      )}
    </div>
  );
}
