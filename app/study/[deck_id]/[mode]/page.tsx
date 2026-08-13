'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, RotateCcw, X, Star, Flame } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';
import { calculateNextInterval, initializeCard, type CardState, type ReviewGrade } from '@/lib/fsrs';
import { gradeWithPartialCredit, calculateSimilarity } from '@/lib/semantic-grading';
import { useGamification } from '@/hooks/useGamification';

type StudyCard = { id: string; question: string; answer: string; cardState?: CardState };

const RATINGS: Array<{ grade: ReviewGrade; labelKey: string; hintKey: string }> = [
  { grade: 'again', labelKey: 'study_rating_again', hintKey: 'study_again_hint' },
  { grade: 'hard', labelKey: 'study_rating_hard', hintKey: 'study_hard_hint' },
  { grade: 'good', labelKey: 'study_rating_good', hintKey: 'study_good_hint' },
  { grade: 'easy', labelKey: 'study_rating_easy', hintKey: 'study_easy_hint' },
];

export default function StudyModePage() {
  const { t } = useTranslation();
  const params = useParams<{ deck_id: string; mode: string }>();
  const router = useRouter();
  const deckId = params.deck_id;
  const mode = params.mode;
  const { state: gamificationState, addXP, updateStreak } = useGamification();
  const [title, setTitle] = useState(t('study_session'));
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const [xpEarned, setXPEarned] = useState(0);
  
  // Learn mode state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Write mode state
  const [userAnswer, setUserAnswer] = useState('');
  const [writeFeedback, setWriteFeedback] = useState('');
  const [writeCorrect, setWriteCorrect] = useState(false);
  
  // Test mode state
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, { correct: boolean; similarity: number }>>({});
  const [showTestResults, setShowTestResults] = useState(false);
  
  // Match mode state
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Array<{ term: string; def: string }>>([]);

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
      setCards((cardRows || []).map((card: StudyCard) => ({ 
        id: card.id, 
        question: card.question, 
        answer: card.answer,
        cardState: initializeCard(),
      })));
      setLoading(false);
    }
    if (deckId) loadDeck();
    return () => { cancelled = true; };
  }, [deckId, t]);

  const card = cards[index];
  const sessionProgress = cards.length ? Math.round(((index + (complete ? 1 : 0)) / cards.length) * 100) : 0;

  const handleNext = () => {
    setFlipped(false);
    setSelectedOption(null);
    setShowFeedback(false);
    setUserAnswer('');
    setWriteFeedback('');
    setWriteCorrect(false);
    setSelectedItems([]);
    if (index >= cards.length - 1) {
      setComplete(true);
      // Update streak when completing a session
      if (gamificationState.enabled) {
        updateStreak();
      }
    }
    else setIndex((value) => value + 1);
  };

  const handleRating = (grade: ReviewGrade) => {
    // Update card state with FSRS
    const updatedCards = [...cards];
    if (updatedCards[index].cardState) {
      updatedCards[index].cardState = calculateNextInterval(updatedCards[index].cardState!, grade);
    }
    setCards(updatedCards);
    
    // Award XP based on grade
    if (gamificationState.enabled) {
      const xpMap = { again: 5, hard: 10, good: 15, easy: 20 };
      const xpEarned = xpMap[grade];
      setXPEarned(prev => prev + xpEarned);
      addXP(xpEarned);
    }
    
    setFlipped(false);
    if (index >= cards.length - 1) setComplete(true);
    else setIndex((value) => value + 1);
  };

  // Learn mode: generate real distractors from other cards
  const getDistractors = () => {
    if (!card || cards.length < 4) return ['Distractor 1', 'Distractor 2', 'Distractor 3'];
    
    const otherCards = cards.filter((c, i) => i !== index);
    const shuffled = [...otherCards].sort(() => Math.random() - 0.5);
    const distractors = shuffled.slice(0, 3).map(c => c.answer);
    
    // Combine with correct answer and shuffle
    const allOptions = [card.answer, ...distractors];
    return allOptions.sort(() => Math.random() - 0.5);
  };

  const handleLearnOption = (optionIndex: number, option: string) => {
    setSelectedOption(optionIndex);
    setIsCorrect(option === card.answer);
    setShowFeedback(true);
  };

  // Write mode: semantic grading
  const handleWriteSubmit = () => {
    const result = gradeWithPartialCredit(userAnswer, card.answer);
    setWriteCorrect(result.correct);
    setWriteFeedback(result.feedback);
  };

  // Test mode: grade all answers
  const handleTestSubmit = () => {
    const results: Record<string, { correct: boolean; similarity: number }> = {};
    cards.forEach((c) => {
      const answer = testAnswers[c.id] || '';
      const similarity = calculateSimilarity(answer, c.answer);
      results[c.id] = {
        correct: similarity >= 0.8,
        similarity,
      };
    });
    setTestResults(results);
    setShowTestResults(true);
  };

  // Match mode: handle selection
  const handleMatchSelect = (itemIndex: number, side: 'term' | 'def') => {
    if (selectedItems.length === 0) {
      setSelectedItems([itemIndex]);
    } else if (selectedItems.length === 1) {
      const firstIndex = selectedItems[0];
      // Check if this is a match (simplified - in real app would check actual pairs)
      if (firstIndex === itemIndex) {
        setSelectedItems([]);
      } else {
        // Assume it's a match for demo
        const currentCard = cards[Math.floor(itemIndex / 2)];
        const pairedCard = cards[Math.floor(firstIndex / 2)];
        setMatchedPairs([...matchedPairs, { term: currentCard.question, def: pairedCard.answer }]);
        setSelectedItems([]);
      }
    }
  };

  if (loading) return <AppShell><div className="grid min-h-[500px] place-items-center text-sm text-muted-foreground">{t('study_loading')}</div></AppShell>;
  if (error) return <AppShell><div className="mx-auto mt-16 max-w-md rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-500">{error}</div></AppShell>;
  if (!cards.length) return <AppShell><div className="mx-auto mt-16 max-w-md rounded-xl border border-dashed border-border p-8 text-center"><p className="font-display text-2xl font-semibold">{t('study_no_cards_title')}</p><p className="mt-2 text-sm text-muted-foreground">{t('study_no_cards_desc')}</p></div></AppShell>;

  const modeTitles: Record<string, string> = {
    flashcards: 'Flashcards',
    learn: 'Leren',
    write: 'Schrijven',
    test: 'Toets',
    match: 'Match',
  };
  const modeTitle = modeTitles[mode] || 'Studeren';

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-10">
        <div className="flex items-center justify-between gap-4">
          <button 
            type="button" 
            onClick={() => router.push('/decks')} 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Terug naar sets
          </button>
          <span className="text-xs text-muted-foreground">{title} • {modeTitle}</span>
        </div>
        
        <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('study_progress', undefined, { n: Math.min(index + 1, cards.length), total: cards.length })}</span>
          <span>{t('study_remaining', undefined, { n: Math.max(cards.length - index, 0) })}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${sessionProgress}%` }} />
        </div>

        {complete ? (
          <div className="mt-14 rounded-xl border border-border bg-card p-6 sm:p-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h1 className="mt-5 font-display text-2xl sm:text-3xl font-semibold">{t('study_complete')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('study_complete_text', undefined, { n: cards.length })}</p>
            {gamificationState.enabled && (
              <div className="mt-6 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
                <div className="flex items-center gap-2 text-amber-500">
                  <Star className="h-5 w-5" />
                  <span className="font-semibold">{xpEarned} XP</span>
                </div>
                <div className="flex items-center gap-2 text-orange-500">
                  <Flame className="h-5 w-5" />
                  <span className="font-semibold">{gamificationState.currentStreak} dag streak</span>
                </div>
              </div>
            )}
            <button 
              type="button" 
              onClick={() => { setIndex(0); setComplete(false); setFlipped(false); setTestAnswers({}); setTestResults({}); setShowTestResults(false); setMatchedPairs([]); setXPEarned(0); }} 
              className="mt-7 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <RotateCcw className="h-4 w-4" /> {t('study_replay')}
            </button>
          </div>
        ) : (
          <>
            {mode === 'flashcards' && (
              <>
                <button 
                  type="button" 
                  onClick={() => setFlipped((value) => !value)} 
                  className="group mt-10 min-h-[300px] sm:min-h-[360px] w-full rounded-2xl border border-border bg-card p-6 sm:p-10 text-center shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {flipped ? t('study_back') : t('study_front')}
                  </span>
                  <span className="mx-auto mt-8 block max-w-2xl font-display text-2xl sm:text-4xl font-semibold leading-tight">
                    {flipped ? card.answer : card.question}
                  </span>
                  <span className="mt-10 block text-xs text-muted-foreground">{t('study_flip_hint')}</span>
                </button>
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {RATINGS.map((rating) => (
                    <button 
                      key={rating.grade} 
                      type="button" 
                      onClick={() => handleRating(rating.grade)} 
                      className={`rounded-md border px-2 py-3 text-center transition-colors hover:bg-secondary ${!flipped ? 'opacity-50' : ''}`}
                    >
                      <span className="block text-sm font-semibold">{t(rating.labelKey)}</span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">{t(rating.hintKey)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {mode === 'learn' && (
              <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Meerkeuze
                </span>
                <h2 className="mx-auto mt-8 font-display text-3xl font-semibold leading-tight">
                  {card.question}
                </h2>
                <div className="mt-8 grid gap-3 max-w-md mx-auto">
                  {getDistractors().map((option, i) => (
                    <button 
                      key={i}
                      onClick={() => !showFeedback && handleLearnOption(i, option)}
                      disabled={showFeedback}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        showFeedback && selectedOption === i
                          ? option === card.answer
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-rose-500 bg-rose-500/10'
                          : 'border-border hover:bg-secondary hover:border-primary/50'
                      } ${showFeedback ? 'opacity-50' : ''}`}
                    >
                      {option}
                      {showFeedback && selectedOption === i && option === card.answer && (
                        <CheckCircle2 className="inline-block ml-2 h-4 w-4 text-emerald-500" />
                      )}
                      {showFeedback && selectedOption === i && option !== card.answer && (
                        <X className="inline-block ml-2 h-4 w-4 text-rose-500" />
                      )}
                    </button>
                  ))}
                </div>
                {showFeedback && (
                  <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700'}`}>
                    {isCorrect ? 'Correct!' : `Niet correct. Het juiste antwoord is: ${card.answer}`}
                  </div>
                )}
                <button 
                  onClick={handleNext}
                  disabled={!showFeedback}
                  className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Volgende
                </button>
              </div>
            )}

            {mode === 'write' && (
              <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Typ je antwoord
                </span>
                <h2 className="mx-auto mt-8 font-display text-3xl font-semibold leading-tight">
                  {card.question}
                </h2>
                <textarea 
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="mt-8 w-full max-w-md mx-auto p-4 rounded-lg border border-border bg-background min-h-[100px]"
                  placeholder="Typ je antwoord hier..."
                />
                {writeFeedback && (
                  <div className={`mt-4 p-4 rounded-lg ${writeCorrect ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700'}`}>
                    {writeFeedback}
                  </div>
                )}
                <button 
                  onClick={writeFeedback ? handleNext : handleWriteSubmit}
                  className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {writeFeedback ? 'Volgende' : 'Controleer'}
                </button>
              </div>
            )}

            {mode === 'test' && (
              <div className="mt-10">
                {!showTestResults ? (
                  <>
                    <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
                      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Toets modus - Beantwoord alle vragen
                      </span>
                      <h2 className="mx-auto mt-8 font-display text-3xl font-semibold leading-tight">
                        {card.question}
                      </h2>
                      <textarea 
                        value={testAnswers[card.id] || ''}
                        onChange={(e) => setTestAnswers({ ...testAnswers, [card.id]: e.target.value })}
                        className="mt-8 w-full max-w-md mx-auto p-4 rounded-lg border border-border bg-background min-h-[100px]"
                        placeholder="Typ je antwoord hier..."
                      />
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button 
                        onClick={() => setIndex(Math.max(0, index - 1))}
                        disabled={index === 0}
                        className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
                      >
                        Vorige
                      </button>
                      {index === cards.length - 1 ? (
                        <button 
                          onClick={handleTestSubmit}
                          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                        >
                          Inleveren
                        </button>
                      ) : (
                        <button 
                          onClick={handleNext}
                          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                        >
                          Volgende
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-10">
                    <h2 className="font-display text-2xl font-semibold">Test Resultaten</h2>
                    <div className="mt-6 space-y-4">
                      {cards.map((c, i) => {
                        const result = testResults[c.id];
                        const answer = testAnswers[c.id] || '';
                        return (
                          <div key={c.id} className={`p-4 rounded-lg border ${result?.correct ? 'border-emerald-500 bg-emerald-500/5' : 'border-rose-500 bg-rose-500/5'}`}>
                            <p className="font-medium">{i + 1}. {c.question}</p>
                            <p className="mt-2 text-sm text-muted-foreground">Jouw antwoord: {answer || '(geen antwoord)'}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Juiste antwoord: {c.answer}</p>
                            <p className="mt-1 text-xs">Overeenkomst: {result?.similarity ? Math.round(result.similarity * 100) : 0}%</p>
                          </div>
                        );
                      })}
                    </div>
                    <button 
                      onClick={() => { setIndex(0); setComplete(true); }}
                      className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                      Afronden
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === 'match' && (
              <div className="mt-10 rounded-2xl border border-border bg-card p-10">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Koppel de paren
                </span>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {cards.slice(0, 4).map((c, i) => (
                      <div 
                        key={i}
                        onClick={() => handleMatchSelect(i, 'term')}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedItems.includes(i) ? 'border-primary bg-primary/10' : 'border-border bg-secondary hover:border-primary/50'
                        }`}
                      >
                        {c.question}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {cards.slice(0, 4).map((c, i) => (
                      <div 
                        key={i + 4}
                        onClick={() => handleMatchSelect(i + 4, 'def')}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedItems.includes(i + 4) ? 'border-primary bg-primary/10' : 'border-border bg-secondary hover:border-primary/50'
                        }`}
                      >
                        {c.answer}
                      </div>
                    ))}
                  </div>
                </div>
                {matchedPairs.length > 0 && (
                  <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500">
                    <p className="text-sm text-emerald-700">Gekoppelde paren: {matchedPairs.length}</p>
                  </div>
                )}
                <button 
                  onClick={handleNext}
                  className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Volgende
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
