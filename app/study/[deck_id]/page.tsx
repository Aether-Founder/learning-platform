'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { defaultSrsProgress, scheduleReview } from '@/lib/learning-platform/srs';
import type { ReviewGrade, UserTermProgress } from '@/types/learning-platform';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';

type StudyCard = { id: string; question: string; answer: string };
const RATINGS: Array<{ grade: ReviewGrade; labelKey: string; hintKey: string }> = [
  { grade: 'again', labelKey: 'study_rating_again', hintKey: 'study_again_hint' },
  { grade: 'hard', labelKey: 'study_rating_hard', hintKey: 'study_hard_hint' },
  { grade: 'good', labelKey: 'study_rating_good', hintKey: 'study_good_hint' },
  { grade: 'easy', labelKey: 'study_rating_easy', hintKey: 'study_easy_hint' },
];

export default function StudyDeckPage() {
  const { t } = useTranslation();
  const params = useParams<{ deck_id: string }>();
  const deckId = params.deck_id;
  const [title, setTitle] = useState(t('study_session'));
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [progress, setProgress] = useState<Record<string, UserTermProgress>>({});
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadDeck() {
      setLoading(true);
      const client = supabase as any;
      const [{ data: deck }, { data: cardRows, error: cardError }] = await Promise.all([
        client.from('study_sets').select('id, title').eq('id', deckId).maybeSingle(),
        client.from('flashcards').select('id, question, answer, order_index').eq('study_set_id', deckId).order('order_index'),
      ]);
      if (cancelled) return;
      if (cardError) setError(t('study_load_error'));
      setTitle(deck?.title || t('study_session'));
      setCards((cardRows || []).map((card: StudyCard) => ({ id: card.id, question: card.question, answer: card.answer })));
      setLoading(false);
    }
    if (deckId) loadDeck();
    return () => { cancelled = true; };
  }, [deckId, t]);

  const card = cards[index];
  const sessionProgress = useMemo(() => cards.length ? Math.round(((index + (complete ? 1 : 0)) / cards.length) * 100) : 0, [cards.length, complete, index]);

  const rate = (grade: ReviewGrade) => {
    if (!card) return;
    const current = progress[card.id] || defaultSrsProgress(card.id);
    const next = scheduleReview(current, grade, 'fsrs');
    setProgress((state) => ({ ...state, [card.id]: next }));
    setFlipped(false);
    if (index >= cards.length - 1) setComplete(true);
    else setIndex((value) => value + 1);
  };

  if (loading) return <AppShell><div className="grid min-h-[500px] place-items-center text-sm text-muted-foreground">{t('study_loading')}</div></AppShell>;
  if (error) return <AppShell><div className="mx-auto mt-16 max-w-md rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-500">{error}</div></AppShell>;
  if (!cards.length) return <AppShell><div className="mx-auto mt-16 max-w-md rounded-xl border border-dashed border-border p-8 text-center"><p className="font-display text-2xl font-semibold">{t('study_no_cards_title')}</p><p className="mt-2 text-sm text-muted-foreground">{t('study_no_cards_desc')}</p></div></AppShell>;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-10">
        <div className="flex items-center justify-between gap-4"><button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> {t('study_stop')}</button><span className="text-xs text-muted-foreground">{title}</span></div>
        <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground"><span>{t('study_progress', undefined, { n: Math.min(index + 1, cards.length), total: cards.length })}</span><span>{t('study_remaining', undefined, { n: Math.max(cards.length - index, 0) })}</span></div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${sessionProgress}%` }} /></div>
        {complete ? <div className="mt-14 rounded-xl border border-border bg-card p-10 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" /><h1 className="mt-5 font-display text-3xl font-semibold">{t('study_complete')}</h1><p className="mt-2 text-sm text-muted-foreground">{t('study_complete_text', undefined, { n: cards.length })}</p><button type="button" onClick={() => { setIndex(0); setComplete(false); setFlipped(false); }} className="mt-7 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><RotateCcw className="h-4 w-4" /> {t('study_replay')}</button></div> : <><button type="button" onClick={() => setFlipped((value) => !value)} className="group mt-10 min-h-[360px] w-full rounded-2xl border border-border bg-card p-10 text-center shadow-sm transition-transform hover:-translate-y-0.5"><span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{flipped ? t('study_back') : t('study_front')}</span><span className="mx-auto mt-8 block max-w-2xl font-display text-4xl font-semibold leading-tight">{flipped ? card.answer : card.question}</span><span className="mt-10 block text-xs text-muted-foreground">{t('study_flip_hint')}</span></button><div className="mt-8 grid grid-cols-4 gap-2">{RATINGS.map((rating) => <button key={rating.grade} type="button" onClick={() => rate(rating.grade)} className={`rounded-md border px-2 py-3 text-center transition-colors hover:bg-secondary ${!flipped ? 'opacity-50' : ''}`}><span className="block text-sm font-semibold">{t(rating.labelKey)}</span><span className="mt-1 block text-[10px] text-muted-foreground">{t(rating.hintKey)}</span></button>)}</div><p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground"><ChevronRight className="h-3.5 w-3.5" /> {t('study_flip_before_rating')}</p></>}
      </div>
    </AppShell>
  );
}
