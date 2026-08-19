'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Brain, Target, AlertTriangle, TrendingUp, RotateCcw } from 'lucide-react';
import { supabase as browserClient } from '@/lib/supabase/client';

const supabase = browserClient as any;

type QuizQuestion = {
  id: string;
  vak: string;
  onderwerp: string;
  type: 'multiple-choice' | 'open' | 'cloze' | 'true-false';
  vraag: string;
  opties?: string[];
  correct_antwoord: string;
  uitleg?: string;
  moeilijkheid: 'makkelijk' | 'gemiddeld' | 'moeilijk';
};

type QuizSession = {
  vragen: QuizQuestion[];
  currentIndex: number;
  antwoorden: Map<string, string>;
  scores: Map<string, boolean>;
  startTime: Date;
  endTime?: Date;
};

export default function DailyQuizPage() {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousSessions, setPreviousSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchQuestions();
    fetchPreviousSessions();
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('daily_quiz_questions')
      .select('*');

    if (error) {
      console.error('Failed to fetch questions:', error);
    } else if (data) {
      setQuestions(data);
    }
    setLoading(false);
  };

  const fetchPreviousSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('daily_quiz_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('quiz_date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Failed to fetch previous sessions:', error);
    } else if (data) {
      setPreviousSessions(data);
    }
  };

  const startQuiz = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Shuffle questions and pick 10
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5).slice(0, 10);
    
    setSession({
      vragen: shuffledQuestions,
      currentIndex: 0,
      antwoorden: new Map(),
      scores: new Map(),
      startTime: new Date(),
    });
    setUserAnswer('');
    setShowAnswer(false);
    setCompleted(false);
  };

  const checkAnswer = () => {
    if (!session) return;

    const currentQuestion = session.vragen[session.currentIndex];
    let isCorrect = false;

    if (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false') {
      isCorrect = userAnswer === currentQuestion.correct_antwoord;
    } else {
      isCorrect = userAnswer.toLowerCase().includes(currentQuestion.correct_antwoord.toLowerCase());
    }

    const newScores = new Map(session.scores);
    newScores.set(currentQuestion.id, isCorrect);

    const newAntwoorden = new Map(session.antwoorden);
    newAntwoorden.set(currentQuestion.id, userAnswer);

    setSession({
      ...session,
      scores: newScores,
      antwoorden: newAntwoorden,
    });
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (!session) return;

    if (session.currentIndex < session.vragen.length - 1) {
      setSession({
        ...session,
        currentIndex: session.currentIndex + 1,
      });
      setUserAnswer('');
      setShowAnswer(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!session) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const endTime = new Date();
    const durationSeconds = Math.round((endTime.getTime() - session.startTime.getTime()) / 1000);
    const correctCount = Array.from(session.scores.values()).filter(Boolean).length;

    const { error } = await supabase
      .from('daily_quiz_sessions')
      .insert({
        user_id: user.id,
        quiz_date: new Date().toISOString().split('T')[0],
        questions: session.vragen,
        answers: Object.fromEntries(session.antwoorden),
        scores: Object.fromEntries(session.scores),
        correct_count: correctCount,
        total_questions: session.vragen.length,
        started_at: session.startTime,
        ended_at: endTime,
        duration_seconds: durationSeconds,
      });

    if (error) {
      console.error('Failed to save session:', error);
    }

    setSession({
      ...session,
      endTime,
    });
    setCompleted(true);
    await fetchPreviousSessions();
  };

  const resetQuiz = () => {
    setSession(null);
    setUserAnswer('');
    setShowAnswer(false);
    setCompleted(false);
  };

  const getDifficultyColor = (moeilijkheid: string) => {
    switch (moeilijkheid) {
      case 'makkelijk': return 'bg-green-500/10 text-green-600';
      case 'gemiddeld': return 'bg-yellow-500/10 text-yellow-600';
      case 'moeilijk': return 'bg-red-500/10 text-red-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  if (!session) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Dagelijkse Quiz"
          title="Daily Quiz"
          description="Test je kennis met een dagelijkse quiz van 10 vragen"
        />

        <div className="mt-10">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 rounded-lg border border-border bg-card" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="font-display text-xl font-semibold mb-2">Geen vragen beschikbaar</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Er zijn nog geen quizvragen toegevoegd. Voeg vragen toe via de database om te beginnen.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <Target className="mx-auto h-16 w-16 text-primary mb-4" />
                <h2 className="font-display text-2xl font-semibold mb-2">Klaar voor de quiz?</h2>
                <p className="text-muted-foreground mb-6">
                  Je krijgt {Math.min(10, questions.length)} willekeurige vragen uit de database.
                </p>
                <Button onClick={startQuiz} size="lg">
                  <Brain className="mr-2 h-5 w-5" />
                  Start Quiz
                </Button>
              </div>

              {/* Previous Sessions */}
              {previousSessions.length > 0 && (
                <div className="mt-10">
                  <h2 className="font-display text-xl font-semibold mb-4">Vorige Resultaten</h2>
                  <div className="space-y-3">
                    {previousSessions.map((session) => (
                      <div key={session.id} className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{session.quiz_date}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.correct_count}/{session.total_questions} correct ({Math.round((session.correct_count / session.total_questions) * 100)}%)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {Math.floor(session.duration_seconds / 60)}m {session.duration_seconds % 60}s
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AppShell>
    );
  }

  if (completed) {
    const correctCount = Array.from(session.scores.values()).filter(Boolean).length;
    const totalTime = session.endTime 
      ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000)
      : 0;

    return (
      <AppShell>
        <PageHeader
          eyebrow="Daily Quiz"
          title="Quiz Voltooid"
          description="Hier zijn je resultaten"
          action={
            <Button variant="outline" onClick={resetQuiz}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Nieuwe quiz
            </Button>
          }
        />

        <div className="mt-10 max-w-3xl mx-auto">
          <div className="rounded-xl border border-border bg-card p-8 text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
              {correctCount >= 8 ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : correctCount >= 5 ? (
                <Brain className="h-12 w-12 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-red-500" />
              )}
            </div>
            <h2 className="font-display text-3xl font-semibold mb-2">{correctCount}/10</h2>
            <p className="text-xl text-muted-foreground mb-6">{correctCount * 10}% correct</p>
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Tijd</p>
                <p className="font-display text-2xl font-semibold">{totalTime} min</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gemiddeld per vraag</p>
                <p className="font-display text-2xl font-semibold">{Math.round(totalTime / 10)} sec</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary">
              {correctCount >= 8 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Uitstekend!</span>
                </>
              ) : correctCount >= 5 ? (
                <>
                  <Brain className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Goed gedaan</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Oefen meer</span>
                </>
              )}
            </div>
          </div>

          {/* Detailed Results */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Gedetailleerde resultaten</h3>
            <div className="space-y-3">
              {session.vragen.map((vraag, index) => {
                const isCorrect = session.scores.get(vraag.id);
                const userAnswer = session.antwoorden.get(vraag.id) || '(geen antwoord)';
                return (
                  <div key={vraag.id} className="p-4 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Vraag {index + 1}</span>
                        <span className="text-xs text-muted-foreground">{vraag.vak}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(vraag.moeilijkheid)}`}>
                          {vraag.moeilijkheid}
                        </span>
                      </div>
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm mb-3">{vraag.vraag}</p>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Jouw antwoord:</p>
                        <p className={isCorrect ? 'text-green-600' : 'text-red-600'}>{userAnswer}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Correct antwoord:</p>
                        <p className="text-green-600">{vraag.correct_antwoord}</p>
                      </div>
                    </div>
                    {vraag.uitleg && (
                      <div className="mt-3 p-3 rounded bg-secondary/50 text-sm">
                        <p className="font-medium mb-1">Uitleg:</p>
                        <p className="text-muted-foreground">{vraag.uitleg}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const currentQuestion = session.vragen[session.currentIndex];
  const progress = ((session.currentIndex + 1) / session.vragen.length) * 100;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Daily Quiz"
        title="Vraag {session.currentIndex + 1}/{session.vragen.length}"
        description={`${currentQuestion.vak} • ${currentQuestion.onderwerp}`}
      />

      <div className="mt-10 max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Voortgang</span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="mb-4 flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(currentQuestion.moeilijkheid)}`}>
              {currentQuestion.moeilijkheid}
            </span>
            <span className="text-sm text-muted-foreground">{currentQuestion.type}</span>
          </div>

          <h2 className="text-xl font-semibold mb-6">{currentQuestion.vraag}</h2>

          {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false') && currentQuestion.opties ? (
            <div className="space-y-3 mb-6">
              {currentQuestion.opties.map((optie, index) => (
                <button
                  key={index}
                  onClick={() => setUserAnswer(optie)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    userAnswer === optie
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-foreground/30 hover:bg-secondary/50'
                    } ${showAnswer && optie === currentQuestion.correct_antwoord ? 'border-green-500 bg-green-500/10' : ''}`}
                  disabled={showAnswer}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                  {optie}
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Typ je antwoord hier..."
                className="w-full h-32 rounded-lg border border-border bg-background p-4 text-sm resize-none focus:border-foreground/40 outline-none"
                disabled={showAnswer}
              />
            </div>
          )}

          {showAnswer ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                userAnswer.toLowerCase().includes(currentQuestion.correct_antwoord.toLowerCase())
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <p className="font-medium mb-2">
                  {userAnswer.toLowerCase().includes(currentQuestion.correct_antwoord.toLowerCase())
                    ? '✓ Correct!'
                    : '✗ Niet helemaal correct'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Jouw antwoord:</span> {userAnswer || '(geen antwoord)'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Correct antwoord:</span> {currentQuestion.correct_antwoord}
                </p>
              </div>

              {currentQuestion.uitleg && (
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="font-medium mb-2">Uitleg</p>
                  <p className="text-sm text-muted-foreground">{currentQuestion.uitleg}</p>
                </div>
              )}

              <Button onClick={nextQuestion} className="w-full">
                {session.currentIndex < session.vragen.length - 1 ? 'Volgende vraag' : 'Bekijk resultaten'}
                <Target className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={checkAnswer} className="w-full" disabled={!userAnswer.trim()}>
              Controleer antwoord
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
