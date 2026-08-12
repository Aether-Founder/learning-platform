'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Edit2,
  Flame,
  Folder,
  FolderOpen,
  Home,
  ListChecks,
  Loader2,
  MoreHorizontal,
  MoveRight,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { MarkdownContent } from './shared/MarkdownContent';
import { useTranslation } from '@/lib/i18n';
import { useLearningPlatformStore } from '@/store/useLearningPlatformStore';
import { LearnMode } from './modes/LearnMode';
import { McqOnlyMode } from './modes/McqOnlyMode';
import { WritingOnlyMode } from './modes/WritingOnlyMode';
import { TestMode } from './modes/TestMode';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SchoolLevel = 'HAVO' | 'VWO';
export type SchoolYear = 4 | 5 | 6;
export type SchoolProfile = 'CM' | 'EM' | 'NG' | 'NT';

export interface UserAccountProfile {
  username: string;
  schoolLevel: SchoolLevel;
  year: SchoolYear;
  schoolProfile: SchoolProfile;
  selectedSubjects: string[];
  isOnboarded: boolean;
}

export interface SourceLearningSet {
  id: string;
  pageName: string;
  pageTitle: string;
  title: string;
  description?: string;
  terms: Array<{ id: string; term: string; definition: string; image?: string }>;
}

export interface LocalCard {
  id: string;
  term: string;
  definition: string;
  image?: string;
  starred?: boolean;
  attempts: number;
  correct: number;
  lastStudied?: string;
}

export interface LocalStudySet {
  id: string;
  title: string;
  description?: string;
  source?: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  cards: LocalCard[];
}

export interface LocalFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

export const ALL_SUBJECTS = [
  'Nederlands',
  'Engels',
  'Frans',
  'Duits',
  'Wiskunde A',
  'Wiskunde B',
  'Wiskunde C',
  'Rekenen',
  'Geschiedenis',
  'Aardrijkskunde',
  'Economie',
  'Bedrijfseconomie (BS)',
  'Biologie',
  'Scheikunde',
  'Natuurkunde (NaSk)',
  'Beeldende Vorming',
  'Levensbeschouwing',
];

export const PROFILE_RECOMMENDED_SUBJECTS: Record<SchoolProfile, string[]> = {
  CM: [
    'Nederlands',
    'Engels',
    'Geschiedenis',
    'Frans',
    'Duits',
    'Beeldende Vorming',
    'Wiskunde A',
    'Levensbeschouwing',
  ],
  EM: [
    'Nederlands',
    'Engels',
    'Economie',
    'Geschiedenis',
    'Wiskunde A',
    'Bedrijfseconomie (BS)',
    'Aardrijkskunde',
  ],
  NG: [
    'Nederlands',
    'Engels',
    'Biologie',
    'Scheikunde',
    'Natuurkunde (NaSk)',
    'Wiskunde A',
    'Aardrijkskunde',
  ],
  NT: [
    'Nederlands',
    'Engels',
    'Natuurkunde (NaSk)',
    'Scheikunde',
    'Wiskunde B',
    'Wiskunde A',
    'Biologie',
  ],
};

// ─── Storage ─────────────────────────────────────────────────────────────────

const USER_PROFILE_KEY = 'aether-user-profile-v1';
const SETS_KEY = 'standalone-learning-platform-v1';
const FOLDERS_KEY = 'aether-folders-v2';

export function loadUserProfile(): UserAccountProfile {
  if (typeof window === 'undefined') return defaultProfile();
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return defaultProfile();
    const p = JSON.parse(raw);
    return {
      username: p.username || '',
      schoolLevel: p.schoolLevel || 'VWO',
      year: p.year || 5,
      schoolProfile: p.schoolProfile || 'NT',
      selectedSubjects:
        Array.isArray(p.selectedSubjects) && p.selectedSubjects.length > 0
          ? p.selectedSubjects
          : PROFILE_RECOMMENDED_SUBJECTS.NT,
      isOnboarded: Boolean(p.isOnboarded),
    };
  } catch {
    return defaultProfile();
  }
}

function defaultProfile(): UserAccountProfile {
  return {
    username: '',
    schoolLevel: 'VWO',
    year: 5,
    schoolProfile: 'NT',
    selectedSubjects: PROFILE_RECOMMENDED_SUBJECTS.NT,
    isOnboarded: false,
  };
}

export function saveUserProfile(profile: UserAccountProfile) {
  if (typeof window !== 'undefined')
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

export function loadSets(): LocalStudySet[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(SETS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSets(sets: LocalStudySet[]) {
  if (typeof window !== 'undefined') localStorage.setItem(SETS_KEY, JSON.stringify(sets));
}

export function loadFolders(): LocalFolder[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveFolders(folders: LocalFolder[]) {
  if (typeof window !== 'undefined') localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function accuracy(set: LocalStudySet) {
  const attempts = set.cards.reduce((s, c) => s + c.attempts, 0);
  if (!attempts) return 0;
  return Math.round((set.cards.reduce((s, c) => s + c.correct, 0) / attempts) * 100);
}

function toLocalSet(
  input: {
    title: string;
    description?: string;
    source?: string;
    folderId?: string;
    cards: Array<{ id?: string; term: string; definition: string; image?: string }>;
  },
  defaultTitle = 'Nieuwe studieset'
): LocalStudySet {
  const now = new Date().toISOString();
  return {
    id: createId('set'),
    title: input.title.trim() || defaultTitle,
    description: input.description?.trim(),
    source: input.source,
    folderId: input.folderId,
    createdAt: now,
    updatedAt: now,
    cards: input.cards
      .filter((c) => c.term.trim() && c.definition.trim())
      .map((c, i) => ({
        id: c.id || createId(`card-${i}`),
        term: c.term.trim(),
        definition: c.definition.trim(),
        image: c.image,
        attempts: 0,
        correct: 0,
      })),
  };
}

// ─── AccountProfileModal ─────────────────────────────────────────────────────

function AccountProfileModal({
  currentProfile,
  onSave,
  onClose,
}: {
  currentProfile: UserAccountProfile;
  onSave: (p: UserAccountProfile) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [username, setUsername] = useState(currentProfile.username || '');
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>(currentProfile.schoolLevel);
  const [year, setYear] = useState<SchoolYear>(currentProfile.year);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(currentProfile.schoolProfile);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    currentProfile.selectedSubjects.length > 0
      ? currentProfile.selectedSubjects
      : PROFILE_RECOMMENDED_SUBJECTS[currentProfile.schoolProfile]
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const toggleSubject = (sub: string) =>
    setSelectedSubjects((p) => (p.includes(sub) ? p.filter((s) => s !== sub) : [...p, sub]));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onSave({
      username: username.trim(),
      schoolLevel,
      year,
      schoolProfile,
      selectedSubjects: selectedSubjects.length > 0 ? selectedSubjects : ALL_SUBJECTS.slice(0, 5),
      isOnboarded: true,
    });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && currentProfile.isOnboarded) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            {currentProfile.isOnboarded ? t('lp_account_title') : t('lp_account_create_title')}
          </h2>
          {currentProfile.isOnboarded && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              {t('lp_username')}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('lp_username_placeholder')}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {t('lp_school_level')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['HAVO', 'VWO'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSchoolLevel(lvl)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${schoolLevel === lvl ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground hover:bg-secondary'}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {t('lp_school_year')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([4, 5, 6] as const).map((yr) => {
                  const disabled = schoolLevel === 'HAVO' && yr === 6;
                  return (
                    <button
                      key={yr}
                      type="button"
                      disabled={disabled}
                      onClick={() => setYear(yr)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${disabled ? 'opacity-30 cursor-not-allowed border-border bg-background text-muted-foreground' : year === yr ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground hover:bg-secondary'}`}
                    >
                      {t('lp_year_ordinal', undefined, { n: yr })}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              {t('lp_school_profile')}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ['CM', 'lp_profile_cm'],
                  ['EM', 'lp_profile_em'],
                  ['NG', 'lp_profile_ng'],
                  ['NT', 'lp_profile_nt'],
                ] as const
              ).map(([prof, label]) => (
                <button
                  key={prof}
                  type="button"
                  onClick={() => {
                    setSchoolProfile(prof);
                    setSelectedSubjects(PROFILE_RECOMMENDED_SUBJECTS[prof]);
                  }}
                  className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${schoolProfile === prof ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground hover:bg-secondary'}`}
                >
                  <span className="text-base font-bold">{prof}</span>
                  <span className="text-[10px] opacity-80 line-clamp-1">{t(label)}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-foreground">
                {t('lp_selected_subjects', undefined, { n: selectedSubjects.length })}
              </label>
              <button
                type="button"
                onClick={() => setSelectedSubjects([...ALL_SUBJECTS])}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {t('lp_select_all')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-44 overflow-y-auto p-1 border border-border rounded-lg bg-background">
              {ALL_SUBJECTS.map((sub) => {
                const sel = selectedSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-medium transition-all ${sel ? 'border-foreground bg-secondary text-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${sel ? 'border-foreground bg-foreground text-background' : 'border-border'}`}
                    >
                      {sel && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            {currentProfile.isOnboarded && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                {t('lp_cancel')}
              </button>
            )}
            <button
              type="submit"
              disabled={!username.trim()}
              className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-bold text-background disabled:opacity-50"
            >
              {t('lp_save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── StreakModal ──────────────────────────────────────────────────────────────

function StreakModal({ streak, onClose }: { streak: number; onClose: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl my-auto text-center">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
          <Flame className="h-10 w-10" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-foreground">
          {t('lp_streak_title', undefined, { n: streak })}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('lp_streak_body')}</p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-foreground py-2.5 text-sm font-bold text-background"
        >
          {t('lp_streak_continue')}
        </button>
      </div>
    </div>
  );
}

// ─── CreateSetPage ────────────────────────────────────────────────────────────

// ─── Import parser helpers ────────────────────────────────────────────────────

function parseImportText(
  raw: string,
  termSep: string,
  cardSep: string
): Array<{ id: string; term: string; definition: string }> {
  const cardDelimiter = cardSep === '\\n' ? '\n' : cardSep === '\\t' ? '\t' : cardSep;
  const termDelimiter = termSep === '\\t' ? '\t' : termSep === '\\n' ? '\n' : termSep;
  return raw
    .split(cardDelimiter)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sepIndex = line.indexOf(termDelimiter);
      if (sepIndex === -1) return null;
      return {
        id: createId('imp'),
        term: line.slice(0, sepIndex).trim(),
        definition: line.slice(sepIndex + termDelimiter.length).trim(),
      };
    })
    .filter(
      (c): c is { id: string; term: string; definition: string } =>
        c !== null && c.term !== '' && c.definition !== ''
    );
}

// ─── ImportPanel (used inside CreateSetPage) ──────────────────────────────────

function ImportPanel({
  onImport,
}: {
  onImport: (cards: Array<{ id: string; term: string; definition: string }>) => void;
}) {
  const { t } = useTranslation();
  const [rawText, setRawText] = useState('');
  const [termSep, setTermSep] = useState('\\t');
  const [cardSep, setCardSep] = useState('\\n');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Array<{ id: string; term: string; definition: string }>>(
    []
  );

  // Live preview for text import
  const updatePreview = (text: string, ts: string, cs: string) => {
    setError('');
    if (!text.trim()) {
      setPreview([]);
      return;
    }
    const result = parseImportText(text, ts, cs);
    setPreview(result);
  };

  const handleTextChange = (v: string) => {
    setRawText(v);
    updatePreview(v, termSep, cardSep);
  };
  const handleTermSepChange = (v: string) => {
    setTermSep(v);
    updatePreview(rawText, v, cardSep);
  };
  const handleCardSepChange = (v: string) => {
    setCardSep(v);
    updatePreview(rawText, termSep, v);
  };

  const handleImportText = () => {
    if (preview.length === 0) {
      setError(t('lp_import_no_cards'));
      return;
    }
    onImport(preview);
    setRawText('');
    setPreview([]);
    setError('');
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-5 space-y-4">
        <p className="text-xs text-muted-foreground">
          {t('lp_import_help_prefix')} <strong>{t('lp_import_tab')}</strong>{' '}
          {t('lp_import_help_mid')} <strong>{t('lp_import_newline')}</strong> {t('lp_import_help_end')}
        </p>

        {/* Separator pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              {t('lp_import_term_sep')}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {(
                [
                  ['\\t', 'lp_import_tab_label'],
                  ['—', 'lp_import_dash'],
                  [';', 'lp_import_semicolon'],
                  [',', 'lp_import_comma'],
                ] as const
              ).map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleTermSepChange(val)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${termSep === val ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground hover:bg-secondary'}`}
                >
                  {t(lbl)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              {t('lp_import_card_sep')}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {(
                [
                  ['\\n', 'lp_import_newline'],
                  [';', 'lp_import_semicolon'],
                ] as const
              ).map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleCardSepChange(val)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${cardSep === val ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground hover:bg-secondary'}`}
                >
                  {t(lbl)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <textarea
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
          placeholder={t('lp_import_placeholder')}
        />

        {/* Live preview */}
        {preview.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {t('lp_import_preview_count', undefined, { n: preview.length })}
            </p>
            <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-border bg-background p-3">
              {preview.slice(0, 8).map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-2 gap-3 text-xs py-1 border-b border-border/50 last:border-0"
                >
                  <span className="font-medium text-foreground truncate">{c.term}</span>
                  <span className="text-muted-foreground truncate">{c.definition}</span>
                </div>
              ))}
              {preview.length > 8 && (
                <p className="text-xs text-muted-foreground pt-1">
                  {t('lp_import_more', undefined, { n: preview.length - 8 })}
                </p>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleImportText}
          disabled={preview.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-bold text-background disabled:opacity-40"
        >
          <Upload className="h-4 w-4" />{' '}
          {preview.length > 0
            ? t('lp_import_count', undefined, { n: preview.length })
            : t('lp_import')}
        </button>
      </div>
    </div>
  );
}

// ─── CreateSetPage ────────────────────────────────────────────────────────────

function CreateSetPage({
  onSave,
  onCancel,
}: {
  onSave: (set: LocalStudySet) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<Array<{ id: string; term: string; definition: string }>>([
    { id: createId('draft'), term: '', definition: '' },
    { id: createId('draft'), term: '', definition: '' },
  ]);
  const [showImport, setShowImport] = useState(false);

  const updateCard = (id: string, field: 'term' | 'definition', value: string) =>
    setCards((c) => c.map((card) => (card.id === id ? { ...card, [field]: value } : card)));

  const addCard = () =>
    setCards((c) => [...c, { id: createId('draft'), term: '', definition: '' }]);
  const removeCard = (id: string) => setCards((c) => c.filter((card) => card.id !== id));

  const handleImport = (imported: Array<{ id: string; term: string; definition: string }>) => {
    // Merge: drop blank placeholder cards first, then append imported
    setCards((prev) => {
      const nonEmpty = prev.filter((c) => c.term.trim() || c.definition.trim());
      return [...nonEmpty, ...imported];
    });
    setShowImport(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const set = toLocalSet({ title, description, cards }, t('lp_new_study_set'));
    if (set.cards.length === 0) return;
    onSave(set);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 pt-8 text-xs text-muted-foreground">
          <button
            onClick={onCancel}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('lp_overview')}
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{t('lp_new_study_set')}</span>
        </nav>

        <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t('lp_making')}
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1]">
              {t('lp_new_study_set')}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t('lp_create_desc')}
            </p>
          </div>
        </section>

        <form onSubmit={submit} className="mt-10 space-y-6">
          {/* Title + description */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {t('lp_title')}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:border-foreground/40"
                placeholder={t('lp_title_placeholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {t('lp_description')}{' '}
                <span className="text-muted-foreground font-normal">{t('lp_optional')}</span>
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:border-foreground/40"
                placeholder={t('lp_description_placeholder')}
              />
            </div>
          </div>

          {/* Import toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${showImport ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-secondary'}`}
            >
              <Upload className="h-4 w-4" />
              {showImport ? t('lp_import_hide') : t('lp_import_cards')}
            </button>
            {!showImport && (
              <span className="ml-3 text-xs text-muted-foreground">{t('lp_import_hint')}</span>
            )}
          </div>

          {showImport && <ImportPanel onImport={handleImport} />}

          {/* Card editor */}
          <div className="space-y-3">
            {cards.map((card, index) => (
              <div key={card.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-muted-foreground">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeCard(card.id)}
                    className="rounded-md p-1 text-muted-foreground hover:text-red-500 hover:bg-secondary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                      {t('lp_term')}
                    </label>
                    <input
                      value={card.term}
                      onChange={(e) => updateCard(card.id, 'term', e.target.value)}
                      className="w-full rounded-lg border-b-2 border-border bg-transparent px-1 py-2 text-foreground focus:outline-none focus:border-foreground"
                      placeholder={t('lp_term_placeholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                      {t('lp_definition')}
                    </label>
                    <input
                      value={card.definition}
                      onChange={(e) => updateCard(card.id, 'definition', e.target.value)}
                      className="w-full rounded-lg border-b-2 border-border bg-transparent px-1 py-2 text-foreground focus:outline-none focus:border-foreground"
                      placeholder={t('lp_definition_placeholder')}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCard}
            className="w-full rounded-lg border-2 border-dashed border-border bg-background py-4 text-sm font-semibold text-muted-foreground hover:border-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> {t('lp_add_card')}
          </button>

          <div className="flex gap-3 justify-end pb-8 border-t border-border pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="h-10 rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              {t('lp_cancel')}
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {t('lp_save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── FolderExplorer ───────────────────────────────────────────────────────────

interface FolderExplorerProps {
  folders: LocalFolder[];
  sets: LocalStudySet[];
  onFoldersChange: (folders: LocalFolder[]) => void;
  onSetsChange: (sets: LocalStudySet[]) => void;
  onSelectSet: (setId: string) => void;
  onBack: () => void;
  onCreateSet: () => void;
}

function FolderExplorer({
  folders,
  sets,
  onFoldersChange,
  onSetsChange,
  onSelectSet,
  onBack,
  onCreateSet,
}: FolderExplorerProps) {
  const { t } = useTranslation();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [movingSetId, setMovingSetId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    type: 'folder' | 'set';
    id: string;
    x: number;
    y: number;
  } | null>(null);

  // breadcrumb path
  const buildPath = (folderId: string | null): LocalFolder[] => {
    if (!folderId) return [];
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return [];
    return [...buildPath(folder.parentId ?? null), folder];
  };
  const path = buildPath(currentFolderId);

  const childFolders = folders.filter((f) => (f.parentId ?? null) === currentFolderId);
  const currentSets = sets.filter((s) => (s.folderId ?? null) === currentFolderId);

  const createFolder = (e: FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folder: LocalFolder = {
      id: createId('folder'),
      name: newFolderName.trim(),
      parentId: currentFolderId ?? undefined,
      createdAt: new Date().toISOString(),
    };
    onFoldersChange([...folders, folder]);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const deleteFolder = (folderId: string) => {
    // Move child sets to parent
    const updatedSets = sets.map((s) =>
      s.folderId === folderId
        ? { ...s, folderId: folders.find((f) => f.id === folderId)?.parentId }
        : s
    );
    // Remove child folders recursively
    const toRemove = new Set<string>();
    const collect = (id: string) => {
      toRemove.add(id);
      folders.filter((f) => f.parentId === id).forEach((f) => collect(f.id));
    };
    collect(folderId);
    onFoldersChange(folders.filter((f) => !toRemove.has(f.id)));
    onSetsChange(updatedSets);
    if (currentFolderId && toRemove.has(currentFolderId)) setCurrentFolderId(null);
  };

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
    setContextMenu(null);
  };
  const commitRename = (id: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    onFoldersChange(folders.map((f) => (f.id === id ? { ...f, name: renameValue.trim() } : f)));
    setRenamingId(null);
  };

  const duplicateSet = (setId: string) => {
    const orig = sets.find((s) => s.id === setId);
    if (!orig) return;
    const copy: LocalStudySet = {
      ...orig,
      id: createId('set'),
      title: `${orig.title} ${t('lp_copy_suffix')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSetsChange([...sets, copy]);
    setContextMenu(null);
  };

  const deleteSet = (setId: string) => {
    onSetsChange(sets.filter((s) => s.id !== setId));
    setContextMenu(null);
  };

  const moveSetToFolder = (setId: string, targetFolderId: string | null) => {
    onSetsChange(
      sets.map((s) => (s.id === setId ? { ...s, folderId: targetFolderId ?? undefined } : s))
    );
    setMovingSetId(null);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'folder' | 'set', id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ type, id, x: e.clientX, y: e.clientY });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24" onClick={() => setContextMenu(null)}>
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] rounded-lg border border-border bg-card shadow-lg py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'folder' ? (
            <>
              <button
                onClick={() =>
                  startRename(
                    contextMenu.id,
                    folders.find((f) => f.id === contextMenu.id)?.name || ''
                  )
                }
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-foreground"
              >
                <Edit2 className="h-4 w-4" /> {t('lp_rename')}
              </button>
              <button
                onClick={() => {
                  deleteFolder(contextMenu.id);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-red-600"
              >
                <Trash2 className="h-4 w-4" /> {t('lp_delete')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  onSelectSet(contextMenu.id);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-foreground"
              >
                <BookOpen className="h-4 w-4" /> {t('lp_open')}
              </button>
              <button
                onClick={() => {
                  setMovingSetId(contextMenu.id);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-foreground"
              >
                <MoveRight className="h-4 w-4" /> {t('lp_move')}
              </button>
              <button
                onClick={() => duplicateSet(contextMenu.id)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-foreground"
              >
                <Copy className="h-4 w-4" /> {t('lp_duplicate')}
              </button>
              <button
                onClick={() => deleteSet(contextMenu.id)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-red-600"
              >
                <Trash2 className="h-4 w-4" /> {t('lp_delete')}
              </button>
            </>
          )}
        </div>
      )}

      {/* Move set dialog */}
      {movingSetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              {t('lp_move_to_folder')}
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => moveSetToFolder(movingSetId, null)}
                className="w-full flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground hover:bg-secondary"
              >
                <Home className="h-4 w-4" /> {t('lp_no_folder')}
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => moveSetToFolder(movingSetId, f.id)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground hover:bg-secondary"
                >
                  <Folder className="h-4 w-4" /> {f.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMovingSetId(null)}
              className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              {t('lp_cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 pt-8 text-xs text-muted-foreground">
        <button
          onClick={onBack}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('lp_overview')}
        </button>
        <span aria-hidden="true">/</span>
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`underline-offset-4 hover:text-foreground hover:underline ${!currentFolderId ? 'text-foreground' : ''}`}
        >
          {t('lp_lists')}
        </button>
        {path.map((f, i) => (
          <span key={f.id} className="flex items-center gap-1">
            <span aria-hidden="true">/</span>
            <button
              onClick={() => setCurrentFolderId(f.id)}
              className={`underline-offset-4 hover:text-foreground hover:underline ${i === path.length - 1 ? 'text-foreground' : ''}`}
            >
              {f.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Header */}
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-8">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t('lp_library')}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1]">
            {currentFolderId ? (path[path.length - 1]?.name ?? t('lp_lists')) : t('lp_lists')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {currentFolderId
              ? t('lp_folder_stats', undefined, {
                  folders: childFolders.length,
                  sets: currentSets.length,
                })
              : t('lp_folder_explore_desc')}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateSet}
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('lp_new_study_set')}
        </button>
      </section>

      {/* New folder input */}
      {showNewFolder && (
        <form onSubmit={createFolder} className="mt-6 flex gap-2">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={t('lp_folder_name')}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {t('lp_create')}
          </button>
          <button
            type="button"
            onClick={() => setShowNewFolder(false)}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            {t('lp_cancel')}
          </button>
        </form>
      )}

      {/* Explorer content */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowNewFolder(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> {t('lp_new_folder')}
          </button>
        </div>

        {childFolders.length === 0 && currentSets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-12 text-center">
            <Folder className="mx-auto mb-3 h-10 w-10 opacity-40 text-muted-foreground" />
            <p className="font-display text-lg text-foreground">{t('lp_folder_empty')}</p>
            <p className="text-sm mt-1 text-muted-foreground">{t('lp_folder_empty_desc')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border border-t border-b border-border">
            {childFolders.map((folder) => (
              <li
                key={folder.id}
                className="group flex items-center gap-3 py-4 hover:bg-secondary/20 transition-colors"
              >
                <FolderOpen className="h-5 w-5 text-amber-500 shrink-0 ml-2" />
                <button
                  className="flex-1 text-left"
                  onDoubleClick={() => setCurrentFolderId(folder.id)}
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  {renamingId === folder.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(folder.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(folder.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className="bg-background border border-border rounded px-2 py-0.5 text-sm text-foreground focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <p className="text-[15px] font-semibold truncate">{folder.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t('lp_folder_item_stats', undefined, {
                          folders: folders.filter((f) => f.parentId === folder.id).length,
                          sets: sets.filter((s) => s.folderId === folder.id).length,
                        })}
                      </p>
                    </>
                  )}
                </button>
                <button
                  onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e as unknown as React.MouseEvent, 'folder', folder.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-muted-foreground hover:bg-secondary mr-2"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </li>
            ))}
            {currentSets.map((set) => (
              <li
                key={set.id}
                className="group flex items-center gap-3 py-4 hover:bg-secondary/20 transition-colors"
              >
                <ListChecks className="h-5 w-5 text-blue-500 shrink-0 ml-2" />
                <button className="flex-1 text-left" onClick={() => onSelectSet(set.id)}>
                  <p className="text-[15px] font-semibold truncate">{set.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t('lp_set_stats', undefined, {
                      cards: set.cards.length,
                      accuracy: accuracy(set),
                    })}
                  </p>
                </button>
                <button
                  onContextMenu={(e) => handleContextMenu(e, 'set', set.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e as unknown as React.MouseEvent, 'set', set.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-muted-foreground hover:bg-secondary mr-2"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── FlashcardStudyWorkspace (simple local mode with flip animation) ─────────

function SimpleFlashcard({ cards }: { cards: LocalCard[] }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0)
    return <p className="text-center text-muted-foreground py-8">{t('lp_no_cards')}</p>;

  const card = cards[index];
  const total = cards.length;

  const go = (d: number) => {
    setFlipped(false);
    setIndex((i) => (i + d + total) % total);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="h-[3px] w-32 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-foreground/70 transition-all"
            style={{ width: `${total ? ((index + 1) / total) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {index + 1} / {total}
        </span>
      </div>

      {/* Flip card */}
      <div
        className="relative w-full cursor-pointer"
        style={{ perspective: '1000px', height: '300px' }}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-lg border border-border bg-secondary/40 flex flex-col items-center justify-center p-8 shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t('lp_term')}
            </span>
            <MarkdownContent className="font-display text-3xl font-semibold text-center text-foreground leading-snug">
              {card.term}
            </MarkdownContent>
            <span className="mt-4 text-xs text-muted-foreground">{t('lp_flip_hint')}</span>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 rounded-lg border border-border bg-secondary flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t('lp_definition')}
            </span>
            <MarkdownContent className="text-lg text-center text-foreground leading-relaxed">
              {card.definition}
            </MarkdownContent>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          className="h-9 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
        >
          {t('lp_previous')}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('lp_next')}
        </button>
      </div>
    </div>
  );
}

// ─── StudySetDetailPage ────────────────────────────────────────────────────────

type StudyTab = 'flashcards' | 'leren' | 'schrijven' | 'meerkeuze' | 'toets';

interface StudySetDetailPageProps {
  set: LocalStudySet;
  onBack: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function StudySetDetailPage({ set, onBack, onDelete, onDuplicate }: StudySetDetailPageProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<StudyTab>('flashcards');
  const [storeReady, setStoreReady] = useState(false);
  const { init, studySet, setActiveMode, refreshPlayableTerms, saveSettingsToStorage } =
    useLearningPlatformStore();

  // Build a StudySet from local cards and init the store
  useEffect(() => {
    const now = new Date();
    const terms = set.cards.map((card) => ({
      id: card.id,
      term: card.term,
      definition: card.definition,
      image: card.image,
      front: card.term,
      back: card.definition,
      cardType: 'basic' as const,
      tags: [],
      isStarred: card.starred ?? false,
      masteryStatus: 'unstudied' as const,
      consecutiveCorrectCount: 0,
      createdAt: now,
      learningSetId: set.id,
      learningSetTitle: set.title,
    }));
    const studySetData = {
      id: set.id,
      title: set.title,
      description: set.description || '',
      terms,
      learningSets: [{ id: set.id, title: set.title, termCount: terms.length }],
      createdAt: now,
      updatedAt: now,
    };
    init(studySetData);
    setStoreReady(false);
    setTimeout(() => {
      refreshPlayableTerms();
      setStoreReady(true);
    }, 80);
    return () => setActiveMode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally initializes the store once per set.id; init/refreshPlayableTerms/setActiveMode are stable store actions
  }, [set.id]);

  const startMode = (tab: StudyTab) => {
    setActiveTab(tab);
    if (tab === 'flashcards') {
      setActiveMode(null);
      return;
    }
    const modeMap: Record<StudyTab, string> = {
      leren: 'learn',
      schrijven: 'writing-only',
      meerkeuze: 'multiple-choice-only',
      toets: 'test',
      flashcards: 'flashcard',
    };
    refreshPlayableTerms();
    saveSettingsToStorage();
    setActiveMode(modeMap[tab] as any);
  };

  const tabs: { id: StudyTab; label: string; hint: string }[] = [
    { id: 'flashcards', label: t('lp_mode_flashcards'), hint: t('lp_mode_flashcards_hint') },
    { id: 'leren', label: t('lp_mode_learn'), hint: t('lp_mode_learn_hint') },
    { id: 'meerkeuze', label: t('lp_mode_mcq'), hint: t('lp_mode_mcq_hint') },
    { id: 'schrijven', label: t('lp_mode_write'), hint: t('lp_mode_write_hint') },
    { id: 'toets', label: t('lp_mode_test'), hint: t('lp_mode_test_hint') },
  ];

  const masteredCount =
    studySet?.terms.filter((term) => term.masteryStatus === 'mastered').length ?? 0;
  const totalTerms = set.cards.length;

  return (
    <div className="mx-auto max-w-4xl px-6 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 pt-8 text-xs text-muted-foreground">
        <button
          onClick={onBack}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('lp_lists')}
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-foreground truncate">{set.title}</span>
      </nav>

      {/* Header */}
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-8">
        <div className="max-w-xl min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t('lp_study_set')}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] truncate">
            {set.title}
          </h1>
          {set.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{set.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
            <span>{t('lp_card_count', undefined, { n: totalTerms })}</span>
            <span>·</span>
            <span>{t('lp_mastered_count', undefined, { n: masteredCount })}</span>
            <span>·</span>
            <span>{t('lp_accuracy', undefined, { n: accuracy(set) })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <Copy className="h-3.5 w-3.5" /> {t('lp_duplicate')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:hover:bg-red-900"
          >
            <Trash2 className="h-3.5 w-3.5" /> {t('lp_delete')}
          </button>
        </div>
      </section>

      {/* Mode sidebar + content */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_260px] lg:gap-12">
        <div className="min-w-0">
          <div key={activeTab}>
            {activeTab === 'flashcards' && <SimpleFlashcard cards={set.cards} />}
            {activeTab !== 'flashcards' && !storeReady && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {activeTab !== 'flashcards' && storeReady && activeTab === 'leren' && <LearnMode />}
            {activeTab !== 'flashcards' && storeReady && activeTab === 'meerkeuze' && (
              <McqOnlyMode />
            )}
            {activeTab !== 'flashcards' && storeReady && activeTab === 'schrijven' && (
              <WritingOnlyMode />
            )}
            {activeTab !== 'flashcards' && storeReady && activeTab === 'toets' && <TestMode />}
          </div>

          {/* Term list (only for flashcards) */}
          {activeTab === 'flashcards' && (
            <div className="mt-12">
              <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3">
                <h2 className="font-display text-2xl font-semibold">{t('lp_terms')}</h2>
                <span className="text-xs text-muted-foreground">
                  {t('lp_card_count', undefined, { n: set.cards.length })}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {set.cards.map((card) => (
                  <li key={card.id} className="grid gap-1 py-4 sm:grid-cols-[1fr_1.4fr] sm:gap-6">
                    <MarkdownContent className="text-[15px] font-semibold">
                      {card.term}
                    </MarkdownContent>
                    <MarkdownContent className="text-sm leading-relaxed text-muted-foreground">
                      {card.definition}
                    </MarkdownContent>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Oefenmodi sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-4 border-b border-border pb-3 font-display text-lg font-semibold">
            {t('lp_practice_modes')}
          </h2>
          <div className="grid gap-2">
            {tabs.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => startMode(m.id)}
                className={`rounded-md border px-4 py-3 text-left transition-colors ${activeTab === m.id ? 'border-foreground bg-secondary' : 'border-border hover:border-foreground/40'}`}
              >
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{m.hint}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-background p-12 text-center">
      <h2 className="font-display text-2xl font-semibold text-foreground">
        {t('lp_empty_state_title')}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t('lp_create_desc')}</p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t('lp_empty_state_cta')}
      </button>
    </div>
  );
}

// ─── Greeting helper ─────────────────────────────────────────────────────────

function getGreeting(t: (id: string) => string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t('lp_greeting_morning');
  if (hour >= 12 && hour < 18) return t('lp_greeting_afternoon');
  return t('lp_greeting_evening');
}

// ─── Progress Meter ──────────────────────────────────────────────────────────

function Meter({ value }: { value: number }) {
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-foreground/70 transition-all"
        style={{ width: `${Math.max(value, 2)}%` }}
      />
    </div>
  );
}

type MainScreen =
  'home' | 'library' | 'create' | 'folders' | 'study-detail';

const DEFAULT_PROFILE: UserAccountProfile = {
  username: '',
  schoolLevel: 'VWO',
  year: 5,
  schoolProfile: 'NT',
  selectedSubjects: PROFILE_RECOMMENDED_SUBJECTS.NT,
  isOnboarded: false,
};

export function StandaloneLearningPlatform({
  sourceSets: _sourceSets,
}: {
  sourceSets: SourceLearningSet[];
}) {
  const { t, currentLanguage } = useTranslation();
  const dateLocale = currentLanguage === 'nl' ? 'nl-NL' : 'en-US';
  const [sets, setSets] = useState<LocalStudySet[]>([]);
  const [folders, setFolders] = useState<LocalFolder[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [screen, setScreen] = useState<MainScreen>('home');
  const [userProfile, setUserProfile] = useState<UserAccountProfile>(DEFAULT_PROFILE);
  const [mounted, setMounted] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStreak, setShowStreak] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedSets = loadSets();
    setSets(storedSets);
    const storedFolders = loadFolders();
    setFolders(storedFolders);
    const profile = loadUserProfile();
    setUserProfile(profile);
    if (!profile.isOnboarded) setShowProfileModal(true);
  }, []);

  const persistSets = (next: LocalStudySet[]) => {
    setSets(next);
    saveSets(next);
  };
  const persistFolders = (next: LocalFolder[]) => {
    setFolders(next);
    saveFolders(next);
  };

  const addSet = (set: LocalStudySet) => {
    persistSets([set, ...sets]);
    setSelectedSetId(set.id);
    setScreen('study-detail');
  };

  const deleteSet = (id: string) => {
    persistSets(sets.filter((s) => s.id !== id));
    if (selectedSetId === id) {
      setSelectedSetId(null);
      setScreen('home');
    }
  };

  const duplicateSet = (id: string) => {
    const orig = sets.find((s) => s.id === id);
    if (!orig) return;
    const copy: LocalStudySet = {
      ...orig,
      id: createId('set'),
      title: `${orig.title} ${t('lp_copy_suffix')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persistSets([copy, ...sets]);
  };

  const handleSaveProfile = (p: UserAccountProfile) => {
    setUserProfile(p);
    saveUserProfile(p);
    setShowProfileModal(false);
  };
  const userInitial = userProfile.username ? userProfile.username[0].toUpperCase() : 'A';

  const streak = mounted ? Number(localStorage.getItem('aether-streak') || '0') : 0;

  // Track streak: if user visits today, bump streak
  useEffect(() => {
    if (!mounted) return;
    const today = new Date().toDateString();
    const last = localStorage.getItem('aether-streak-date');
    if (last !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const cur = Number(localStorage.getItem('aether-streak') || '0');
      const next = last === yesterday ? cur + 1 : 1;
      localStorage.setItem('aether-streak', String(next));
      localStorage.setItem('aether-streak-date', today);
    }
  }, [mounted]);

  const practiceRows = useMemo(() => {
    const subs = selectedSubjectFilter ? [selectedSubjectFilter] : userProfile.selectedSubjects;

    return subs.map((sub) => {
      // Find all sets that match this subject
      const subjectSets = sets.filter((s) => {
        const subName = sub.split(' ')[0].toLowerCase();
        return (
          s.title.toLowerCase().includes(subName) ||
          s.description?.toLowerCase().includes(subName) ||
          s.source?.toLowerCase().includes(subName)
        );
      });

      if (subjectSets.length > 0) {
        // Calculate real stats from all matching sets
        const totalCards = subjectSets.reduce((sum, s) => sum + s.cards.length, 0);
        const studiedCards = subjectSets.reduce(
          (sum, s) => sum + s.cards.filter((c) => c.attempts > 0).length,
          0
        );
        const totalSets = subjectSets.length;

        return {
          title: sub,
          subtitle: t('lp_progress_subtitle_sets', undefined, {
            level: userProfile.schoolLevel,
            year: userProfile.year,
            n: totalSets,
          }),
          done: studiedCards,
          total: Math.max(1, totalCards),
        };
      }

      // No sets for this subject yet
      return {
        title: sub,
        subtitle: `${userProfile.schoolLevel} ${userProfile.year} · ${userProfile.schoolProfile}`,
        done: 0,
        total: 5,
      };
    });
  }, [sets, userProfile, selectedSubjectFilter, t]);

  const selectedSet = sets.find((s) => s.id === selectedSetId) ?? null;

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Modals */}
      {showProfileModal && (
        <AccountProfileModal
          currentProfile={userProfile}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}
      {showStreak && <StreakModal streak={streak || 1} onClose={() => setShowStreak(false)} />}

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-8 px-8">
          {/* Logo */}
          <button
            type="button"
            onClick={() => setScreen('home')}
            className="flex items-center gap-3"
          >
            <img
              src="https://aether-dub5.vercel.app/logo.png"
              alt="Aether logo"
              className="h-8 w-8 rounded-md object-contain"
            />
            <span
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
              className="text-2xl font-normal tracking-tight"
            >
              Aether
            </span>
          </button>

          {/* Nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() => setScreen('home')}
              className={`relative px-4 py-2 text-[15px] font-medium transition-colors ${screen === 'home' ? 'text-foreground after:absolute after:inset-x-4 after:-bottom-[21px] after:h-px after:bg-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('lp_overview')}
            </button>
            <button
              type="button"
              onClick={() => setScreen('folders')}
              className={`relative px-4 py-2 text-[15px] font-medium transition-colors ${screen === 'library' || screen === 'folders' ? 'text-foreground after:absolute after:inset-x-4 after:-bottom-[21px] after:h-px after:bg-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('lp_lists')}
            </button>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            {/* Nieuw button */}
            <button
              type="button"
              onClick={() => setScreen('create')}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {t('lp_new')}
            </button>
            {/* Search */}
            <label className="hidden h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground lg:flex">
              <Search className="h-4 w-4" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
                placeholder={t('lp_search_placeholder')}
              />
            </label>
            {/* Streak */}
            {streak > 0 && (
              <button
                type="button"
                onClick={() => setShowStreak(true)}
                className="hidden items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-500 sm:inline-flex"
              >
                {t('lp_streak_days', undefined, { n: streak })}
              </button>
            )}
            {/* Avatar */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              title={t('lp_account_title')}
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-sm font-medium"
            >
              {userInitial}
            </button>
          </div>
        </div>
      </header>

      {/* ── Screen router ── */}
      {screen === 'create' && (
        <CreateSetPage
          onSave={(set) => {
            addSet(set);
          }}
          onCancel={() => setScreen('home')}
        />
      )}

      {screen === 'folders' && (
        <FolderExplorer
          folders={folders}
          sets={sets}
          onFoldersChange={persistFolders}
          onSetsChange={persistSets}
          onSelectSet={(id) => {
            setSelectedSetId(id);
            setScreen('study-detail');
          }}
          onBack={() => setScreen('home')}
          onCreateSet={() => setScreen('create')}
        />
      )}

      {screen === 'study-detail' && selectedSet && (
        <StudySetDetailPage
          set={selectedSet}
          onBack={() => setScreen('library')}
          onDelete={() => {
            deleteSet(selectedSet.id);
            setScreen('library');
          }}
          onDuplicate={() => {
            duplicateSet(selectedSet.id);
          }}
        />
      )}

      {screen === 'study-detail' && !selectedSet && (
        <div className="mx-auto max-w-7xl px-5 py-12 text-center">
          <p className="text-muted-foreground">{t('lp_set_not_found')}</p>
          <button
            onClick={() => setScreen('home')}
            className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background"
          >
            {t('lp_back_home')}
          </button>
        </div>
      )}

      {screen === 'library' && (
        <FolderExplorer
          folders={folders}
          sets={sets}
          onFoldersChange={persistFolders}
          onSetsChange={persistSets}
          onSelectSet={(id) => {
            setSelectedSetId(id);
            setScreen('study-detail');
          }}
          onBack={() => setScreen('home')}
          onCreateSet={() => setScreen('create')}
        />
      )}

      {screen === 'home' && (
        <div className="mx-auto max-w-[1400px] space-y-12 px-8 pb-24">
          {/* Welcome banner */}
          <section className="grid gap-8 border-b border-border py-12 md:grid-cols-[1.4fr_1fr] md:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {userProfile.schoolLevel} {userProfile.year} · {userProfile.schoolProfile} ·{' '}
                {userProfile.selectedSubjects.length} {t('lp_subjects_upper')}
              </p>
              <h1
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
                className="mt-3 text-5xl font-semibold leading-[1.05]"
              >
                {getGreeting(t)}, {userProfile.username || t('lp_guest_name')}
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {t('lp_review_prompt', undefined, {
                  n: sets.reduce((sum, s) => sum + s.cards.filter((c) => c.attempts === 0).length, 0),
                  title: sets.length > 0 ? sets[0].title : t('lp_first_set'),
                })}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (sets.length > 0) {
                      setSelectedSetId(sets[0].id);
                      setScreen('study-detail');
                    } else setScreen('create');
                  }}
                  className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t('lp_start_session')}
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('library')}
                  className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  {t('lp_view_subjects')}
                </button>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-6 md:border-l md:border-border md:pl-8">
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-3xl font-semibold leading-none">
                  {sets.length}
                </span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t('lp_sets')}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-3xl font-semibold leading-none">
                  {userProfile.selectedSubjects.length}
                </span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t('lp_subjects')}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-3xl font-semibold leading-none">
                  {sets.reduce((sum, s) => sum + s.cards.filter((c) => c.attempts === 0).length, 0)}
                </span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t('lp_to_review')}
                </span>
              </div>
            </dl>
          </section>

          {/* Subject filter pills */}
          <div className="flex flex-wrap items-center gap-2 py-4">
            <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t('lp_subject_label')}
            </span>
            <button
              type="button"
              onClick={() => setSelectedSubjectFilter(null)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${!selectedSubjectFilter ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'}`}
            >
              {t('lp_all_subjects')}
            </button>
            {userProfile.selectedSubjects.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubjectFilter(sub === selectedSubjectFilter ? null : sub)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${selectedSubjectFilter === sub ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'}`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Progress per subject */}
          <div className="grid gap-14 lg:grid-cols-[1fr_380px]">
            <div className="min-w-0">
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-4">
                <h2
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  className="text-3xl font-semibold"
                >
                  {t('lp_progress_per_subject')}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {selectedSubjectFilter
                    ? t('lp_one_subject')
                    : t('lp_subject_count', undefined, {
                        n: userProfile.selectedSubjects.length,
                      })}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {practiceRows.map((row) => (
                  <li
                    key={row.title}
                    className="grid grid-cols-[1fr_auto] items-center gap-6 py-6 sm:grid-cols-[1.4fr_1fr_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[17px] font-semibold">{row.title}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">{row.subtitle}</p>
                    </div>
                    <div className="hidden sm:block">
                      <div className="mb-2 flex items-baseline justify-between text-[13px] text-muted-foreground">
                        <span>
                          {t('lp_topics_done', undefined, { done: row.done, total: row.total })}
                        </span>
                        <span className="tabular-nums">
                          {Math.round((row.done / Math.max(row.total, 1)) * 100)}%
                        </span>
                      </div>
                      <Meter value={Math.round((row.done / Math.max(row.total, 1)) * 100)} />
                    </div>
                    <div className="flex items-center justify-end gap-4">
                      {row.done === row.total ? (
                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">
                          {t('lp_up_to_date')}
                        </span>
                      ) : (
                        <span className="text-[13px] tabular-nums text-muted-foreground">
                          {t('lp_to_do', undefined, { n: row.total - row.done })}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setScreen('library')}
                        className="inline-flex h-9 items-center rounded-md border border-border px-4 text-[13px] font-medium transition-colors hover:bg-secondary"
                      >
                        {t('lp_open')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
              <div>
                <h2
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  className="mb-5 border-b border-border pb-4 text-2xl font-semibold"
                >
                  {t('lp_study_rhythm')}
                </h2>
                <div className="flex items-end gap-1.5">
                  {(() => {
                    // Calculate real study activity for last 7 days
                    const today = new Date();
                    const last7Days = Array.from({ length: 7 }, (_, i) => {
                      const date = new Date(today);
                      date.setDate(date.getDate() - (6 - i));
                      return date.toDateString();
                    });

                    // Count cards studied per day
                    const activityByDay = last7Days.map((dateStr) => {
                      const cardsStudied = sets.reduce(
                        (sum, set) =>
                          sum +
                          set.cards.filter(
                            (c) =>
                              c.lastStudied && new Date(c.lastStudied).toDateString() === dateStr
                          ).length,
                        0
                      );
                      return cardsStudied;
                    });

                    const maxActivity = Math.max(...activityByDay, 1);
                    const percentages = activityByDay.map((count) =>
                      maxActivity > 0 ? Math.round((count / maxActivity) * 100) : 0
                    );

                    return percentages.map((pct, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="flex w-full items-end rounded-sm bg-secondary"
                          style={{ height: 64 }}
                          aria-hidden="true"
                        >
                          <div
                            className="w-full rounded-sm bg-foreground/60 transition-all"
                            style={{ height: `${Math.max(pct, 5)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(last7Days[i]).toLocaleDateString(dateLocale, {
                            weekday: 'narrow',
                          })}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {(() => {
                    const totalStudied = sets.reduce(
                      (sum, s) => sum + s.cards.filter((c) => c.attempts > 0).length,
                      0
                    );
                    const avgPerDay = totalStudied > 0 ? Math.round(totalStudied / 7) : 0;
                    return t('lp_avg_per_day', undefined, { n: avgPerDay });
                  })()}
                </p>
              </div>
            </aside>
          </div>

          {/* Recent sets */}
          {sets.length > 0 && (
            <section className="mt-14">
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-4">
                <h2
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  className="text-3xl font-semibold"
                >
                  {t('lp_recent_sets')}
                </h2>
                <button
                  type="button"
                  onClick={() => setScreen('library')}
                  className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t('lp_all_sets')}
                </button>
              </div>
              <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                {sets.slice(0, 6).map((set) => (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => {
                      setSelectedSetId(set.id);
                      setScreen('study-detail');
                    }}
                    className="bg-background p-8 transition-colors hover:bg-secondary/50 text-left"
                  >
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {set.source || t('lp_own_set')}
                    </p>
                    <h3
                      style={{ fontFamily: 'Cormorant Garamond, serif' }}
                      className="mt-3 text-3xl font-semibold truncate"
                    >
                      {set.title}
                    </h3>
                    <p className="mt-2 text-[13px] text-muted-foreground">
                      {t('lp_set_stats', undefined, {
                        cards: set.cards.length,
                        accuracy: accuracy(set),
                      })}
                    </p>
                    {set.description && (
                      <p className="mt-4 text-[13px] text-muted-foreground line-clamp-2">
                        {set.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {sets.length === 0 && <EmptyState onCreate={() => setScreen('create')} />}
        </div>
      )}
    </main>
  );
}
