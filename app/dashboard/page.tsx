'use client';

// Disable SSR for dashboard
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, CalendarPlus, FilePlus2, Clock, AlertTriangle, Target, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { AppShell, PageHeader, Meter } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useRequireAuth, useUserProfile } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';

type Counts = { sets: number; sessions: number };
type Greeting = { firstVisit: boolean; name: string };
type Subject = {
  id: string;
  name: string;
  mastery_percentage?: number;
  upcoming_tests?: number;
  average_grade?: string;
};

function DashboardSkeleton() {
  return (
    <div aria-label="Pagina laden" role="status">
      <section className="border-b border-border py-10">
        <div className="max-w-xl">
          <div className="skeleton-line h-3 w-28" />
          <div className="skeleton-line mt-4 h-9 w-72 max-w-full" />
          <div className="skeleton-line mt-4 h-4 w-full max-w-md" />
        </div>
      </section>

      <section className="grid gap-4 py-8 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="subject-skeleton rounded-xl border border-border bg-card p-5">
            <div className="skeleton-line h-3 w-24" />
            <div className="skeleton-line mt-3 h-9 w-16" />
            <div className="skeleton-line mt-3 h-4 w-40 max-w-full" />
          </div>
        ))}
      </section>

      <section className="subject-skeleton mb-8 rounded-xl border border-border bg-card p-5">
        <div className="skeleton-line h-6 w-48 max-w-full" />
        <div className="skeleton-line mt-4 h-4 w-64 max-w-full" />
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, loading: userLoading } = useRequireAuth('/dashboard');
  const { profile, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [spacedRepetitionCount, setSpacedRepetitionCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [agendaEvents, setAgendaEvents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'student';
  const authSettled = !userLoading && !profileLoading;
  const userId = user?.id;

  useEffect(() => {
    if (!authSettled) return;
    if (!userId) {
      setCounts({ sets: 0, sessions: 0 });
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function loadCounts() {
      const client = supabase as any;
      const [{ count: sets }, { count: sessions }] = await Promise.all([
        client.from('study_sets').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        client.from('flashcards').select('id', { count: 'exact', head: true }),
      ]);
      if (!cancelled) {
        setCounts({ sets: sets ?? 0, sessions: sessions ?? 0 });
      }
    }

    async function loadLearningData() {
      const client = supabase as any;
      const [{ count: srCount }, { count: errCount }] = await Promise.all([
        client.from('spaced_repetition_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        client.from('error_log').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);
      if (!cancelled) {
        setSpacedRepetitionCount(srCount ?? 0);
        setErrorCount(errCount ?? 0);
      }
    }

    async function loadAgendaEvents() {
      try {
        const stored = localStorage.getItem('aether_agenda_events');
        if (stored) {
          const events = JSON.parse(stored);
          const now = new Date();
          const upcoming = events
            .filter((e: any) => new Date(e.startDate) >= now)
            .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .slice(0, 3);
          if (!cancelled) setAgendaEvents(upcoming);
        }
      } catch {
        // Ignore storage errors
      }
    }

    async function loadSubjects() {
      const client = supabase as any;
      const { data, error } = await client
        .from('subjects')
        .select(`
          id,
          name,
          subject_chapters(
            subject_topics(
              mastery_tracking(
                mastery_percentage,
                status
              )
            )
          ),
          subject_tests(
            test_date
          ),
          subject_grades(
            grade
          )
        `)
        .eq('user_id', userId)
        .order('name');

      if (!cancelled && !error && data) {
        const processedSubjects = data.map((subject: any) => {
          // Calculate average mastery
          let totalMastery = 0;
          let masteryCount = 0;
          subject.subject_chapters?.forEach((chapter: any) => {
            chapter.subject_topics?.forEach((topic: any) => {
              if (topic.mastery_tracking) {
                totalMastery += topic.mastery_tracking.mastery_percentage || 0;
                masteryCount++;
              }
            });
          });
          const avgMastery = masteryCount > 0 ? Math.round(totalMastery / masteryCount) : 0;

          // Count upcoming tests
          const now = new Date();
          const upcomingTests = subject.subject_tests?.filter((test: any) => new Date(test.test_date) >= now).length || 0;

          // Calculate average grade
          const grades = subject.subject_grades?.map((g: any) => g.grade) || [];
          const avgGrade = grades.length > 0 ? (grades.reduce((a: number, b: number) => a + b, 0) / grades.length).toFixed(1) : undefined;

          return {
            id: subject.id,
            name: subject.name,
            mastery_percentage: avgMastery,
            upcoming_tests: upcomingTests,
            average_grade: avgGrade,
          };
        }).sort((a, b) => a.name.localeCompare(b.name));
        setSubjects(processedSubjects);
      }
    }

    Promise.all([loadCounts(), loadLearningData(), loadAgendaEvents(), loadSubjects()])
      .catch(() => {
        if (!cancelled) {
          setCounts({ sets: 0, sessions: 0 });
          setSpacedRepetitionCount(0);
          setErrorCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authSettled, userId]);

  useEffect(() => {
    if (!authSettled) return;
    
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore) localStorage.setItem('hasVisitedBefore', 'true');

    let name = displayName;
    if (displayName && displayName !== 'student') localStorage.setItem('username', displayName);
    else name = localStorage.getItem('username') || displayName;

    setGreeting({ firstVisit: !hasVisitedBefore, name });
  }, [authSettled, displayName]);

  // Redirect to vakken if user needs setup
  useEffect(() => {
    if (!authSettled || !userId || profileLoading) return;
    
    if (!profile?.grade_level) {
      const setupComplete = localStorage.getItem(`aether-grade-setup-complete:${userId}`);
      if (setupComplete !== 'true') {
        router.push('/vakken');
      }
    }
  }, [authSettled, userId, profile?.grade_level, profileLoading, router]);

  const ready = authSettled && counts !== null && greeting !== null && !loading;

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDutchTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDutchDate = (date: Date) => {
    return date.toLocaleDateString('nl-NL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!ready) {
    return (
      <AppShell>
        <DashboardSkeleton />
      </AppShell>
    );
  }

  const { sets, sessions } = counts;
  const title = greeting.firstVisit
    ? `Welkom, ${displayName}`
    : t('dashboard_welcome_name', undefined, { name: greeting.name });

  return (
    <AppShell fullWidth>
      <div className="mx-auto max-w-6xl px-6">
        <PageHeader eyebrow={t('dashboard_eyebrow')} title={title} description={t('dashboard_description')} fullWidth />
      </div>

      {/* Full-Width Three-Column Layout - Responsive */}
      <div className="pt-8 min-h-[calc(100vh-200px)]">
        
        {/* On large screens: 2-column layout with expanded main content */}
        <div className="hidden lg:grid gap-6 grid-cols-[1fr_320px] items-start">
          {/* Main Content - Flexible Width with consistent height */}
          <div className="space-y-6 flex flex-col">
            {/* Time/Date Widget */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div>
                <p className="text-3xl font-semibold">{formatDutchTime(currentTime)}</p>
                <p className="text-sm text-muted-foreground capitalize">{formatDutchDate(currentTime)}</p>
              </div>
            </div>

            {/* Quick Actions Widget */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Link href="/quiz/daily" className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Start Daily Quiz</p>
                  <p className="text-xs text-muted-foreground">Dagelijkse herhaling</p>
                </div>
              </Link>
              <Link href="/foutenlogboek" className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Foutenreview</p>
                  <p className="text-xs text-muted-foreground">{errorCount} fouten om te herhalen</p>
                </div>
              </Link>
              <Link href="/active-recall" className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Active Recall</p>
                  <p className="text-xs text-muted-foreground">Nieuwe vragen toevoegen</p>
                </div>
              </Link>
            </div>

            {/* Stats Widgets - Fluid 4-Column Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Herhalingen</span>
                </div>
                <p className="font-display text-2xl font-semibold">{spacedRepetitionCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Totaal items</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Fouten</span>
                </div>
                <p className="font-display text-2xl font-semibold">{errorCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Geregistreerd</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Leersets</span>
                </div>
                <p className="font-display text-2xl font-semibold">{sets}</p>
                <p className="text-xs text-muted-foreground mt-1">Totaal leersets</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Kaarten</span>
                </div>
                <p className="font-display text-2xl font-semibold">{sessions}</p>
                <p className="text-xs text-muted-foreground mt-1">Totaal kaarten</p>
              </div>
            </div>

            {/* Progress per Subject Widget */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold">Voortgang per vak</h2>
                <Link href="/vakken" className="text-sm text-primary hover:underline">
                  Bekijk alle vakken
                </Link>
              </div>
              
              {subjects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Nog geen vakken toegevoegd.</p>
                  <Link href="/vakken" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                    <FilePlus2 className="h-4 w-4" />
                    + Voeg je eerste vak toe
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {subjects.map((subject) => {
                    const mastery = subject.mastery_percentage || 0;
                    const status = mastery >= 80 ? 'veilig' : mastery >= 50 ? 'let op' : 'gevaar';
                    const statusText = mastery >= 80 ? 'Veilig' : mastery >= 50 ? 'Let op' : 'Gevaar';
                    const statusColor = mastery >= 80 ? 'text-green-600' : mastery >= 50 ? 'text-yellow-600' : 'text-red-600';
                    
                    return (
                      <div key={subject.id} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3">
                          <p className="font-medium">{subject.name}</p>
                        </div>
                        <div className="col-span-5">
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${mastery}%` }}
                            />
                          </div>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="font-semibold">{mastery}%</p>
                        </div>
                        <div className="col-span-1 text-center">
                          <p className={`text-xs font-medium ${statusColor}`}>{statusText} te doen</p>
                        </div>
                        <div className="col-span-1 text-right">
                          <Link 
                            href={`/vakken/${subject.id}`}
                            className="text-sm text-primary hover:underline font-medium"
                          >
                            Openen
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Fixed Width with consistent height */}
          <div className="space-y-6 flex flex-col">
            {/* Agenda Widget */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold">Agenda</h2>
                <Link href="/agenda" className="text-xs text-primary hover:underline">
                  Bekijk alles
                </Link>
              </div>
              {agendaEvents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <CalendarPlus className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-xs text-muted-foreground mb-4">Geen aankomende evenementen.</p>
                  <Link href="/agenda" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                    <CalendarPlus className="h-4 w-4" />
                    + Voeg evenement toe
                  </Link>
                </div>
              ) : (
                <div className="flex-1 space-y-2">
                  {agendaEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/50">
                      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-muted mt-1.5" />
                      <div>
                        <p className="text-xs font-medium">{event.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString('nl-NL', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Learning Progress Widget */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col min-h-[200px]">
              <h2 className="font-display text-lg font-semibold mb-4">Leer Voortgang</h2>
              {spacedRepetitionCount === 0 && errorCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Nog geen leeractiviteit.</p>
                  <Link href="/create/leerlijst" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                    <FilePlus2 className="h-4 w-4" />
                    + Voeg je eerste leerlijst toe
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <span className="font-medium text-sm">Spaced Repetition</span>
                    <span className="text-sm text-muted-foreground">{spacedRepetitionCount} items</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <span className="font-medium text-sm">Foutenlogboek</span>
                    <span className="text-sm text-muted-foreground">{errorCount} fouten</span>
                  </div>
                </div>
              )}
            </div>

            {/* Study Trend Widget */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold">Studie trend</h2>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deze week</span>
                  <span className="font-semibold">{spacedRepetitionCount + errorCount} activiteiten</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gemiddelde score</span>
                  <span className="font-semibold">75%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <span className="font-semibold">3 dagen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* On smaller screens: Single column with main content first, then widgets */}
        <div className="lg:hidden space-y-6">
          {/* Middle Content - Full Width */}
          <div className="space-y-6">
            {/* Time/Date Widget */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div>
                <p className="text-3xl font-semibold">{formatDutchTime(currentTime)}</p>
                <p className="text-sm text-muted-foreground capitalize">{formatDutchDate(currentTime)}</p>
              </div>
            </div>

            {/* Quick Actions Widget */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Link href="/quiz/daily" className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Start Daily Quiz</p>
                  <p className="text-xs text-muted-foreground">Dagelijkse herhaling</p>
                </div>
              </Link>
              <Link href="/foutenlogboek" className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Foutenreview</p>
                  <p className="text-xs text-muted-foreground">{errorCount} fouten om te herhalen</p>
                </div>
              </Link>
              <Link href="/active-recall" className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Active Recall</p>
                  <p className="text-xs text-muted-foreground">Nieuwe vragen toevoegen</p>
                </div>
              </Link>
            </div>

            {/* Stats Widgets - Fluid 4-Column Grid */}
            <div className="grid gap-4 grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Herhalingen</span>
                </div>
                <p className="font-display text-2xl font-semibold">{spacedRepetitionCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Totaal items</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Fouten</span>
                </div>
                <p className="font-display text-2xl font-semibold">{errorCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Geregistreerd</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Leersets</span>
                </div>
                <p className="font-display text-2xl font-semibold">{sets}</p>
                <p className="text-xs text-muted-foreground mt-1">Totaal leersets</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Kaarten</span>
                </div>
                <p className="font-display text-2xl font-semibold">{sessions}</p>
                <p className="text-xs text-muted-foreground mt-1">Totaal kaarten</p>
              </div>
            </div>

            {/* Progress per Subject Widget */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold">Voortgang per vak</h2>
                <Link href="/vakken" className="text-sm text-primary hover:underline">
                  Bekijk alle vakken
                </Link>
              </div>
              
              {subjects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Nog geen vakken toegevoegd.</p>
                  <Link href="/vakken" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                    <FilePlus2 className="h-4 w-4" />
                    + Voeg je eerste vak toe
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {subjects.map((subject) => {
                    const mastery = subject.mastery_percentage || 0;
                    const status = mastery >= 80 ? 'veilig' : mastery >= 50 ? 'let op' : 'gevaar';
                    const statusText = mastery >= 80 ? 'Veilig' : mastery >= 50 ? 'Let op' : 'Gevaar';
                    const statusColor = mastery >= 80 ? 'text-green-600' : mastery >= 50 ? 'text-yellow-600' : 'text-red-600';
                    
                    return (
                      <div key={subject.id} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3">
                          <p className="font-medium">{subject.name}</p>
                        </div>
                        <div className="col-span-5">
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${mastery}%` }}
                            />
                          </div>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="font-semibold">{mastery}%</p>
                        </div>
                        <div className="col-span-1 text-center">
                          <p className={`text-xs font-medium ${statusColor}`}>{statusText} te doen</p>
                        </div>
                        <div className="col-span-1 text-right">
                          <Link 
                            href={`/vakken/${subject.id}`}
                            className="text-sm text-primary hover:underline font-medium"
                          >
                            Openen
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Widgets below main content on mobile */}
          <div className="space-y-6">
            {/* Agenda Widget */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold">Agenda</h2>
                <Link href="/agenda" className="text-xs text-primary hover:underline">
                  Bekijk alles
                </Link>
              </div>
              {agendaEvents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <CalendarPlus className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-xs text-muted-foreground mb-4">Geen aankomende evenementen.</p>
                  <Link href="/agenda" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                    <CalendarPlus className="h-4 w-4" />
                    + Voeg evenement toe
                  </Link>
                </div>
              ) : (
                <div className="flex-1 space-y-2">
                  {agendaEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/50">
                      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-muted mt-1.5" />
                      <div>
                        <p className="text-xs font-medium">{event.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString('nl-NL', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Learning Progress Widget */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col min-h-[200px]">
                <h2 className="font-display text-lg font-semibold mb-4">Leer Voortgang</h2>
                {spacedRepetitionCount === 0 && errorCount === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">Nog geen leeractiviteit.</p>
                    <Link href="/create/leerlijst" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                      <FilePlus2 className="h-4 w-4" />
                      + Voeg je eerste leerlijst toe
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="font-medium text-sm">Spaced Repetition</span>
                      <span className="text-sm text-muted-foreground">{spacedRepetitionCount} items</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="font-medium text-sm">Foutenlogboek</span>
                      <span className="text-sm text-muted-foreground">{errorCount} fouten</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Study Trend Widget */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col min-h-[200px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">Studie trend</h2>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Deze week</span>
                    <span className="font-semibold">{spacedRepetitionCount + errorCount} activiteiten</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Gemiddelde score</span>
                    <span className="font-semibold">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Streak</span>
                    <span className="font-semibold">3 dagen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sets === 0 && sessions === 0 && (
        <div className="mx-auto max-w-6xl px-6">
          <section className="rounded-xl border border-dashed border-border p-8 text-center">
            <BookOpen className="mx-auto h-9 w-9 text-muted-foreground" />
            <h2 className="mt-4 font-display text-2xl font-semibold">{t('dashboard_empty_title')}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{t('dashboard_empty_desc')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/leersets" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
                <FilePlus2 className="h-4 w-4" />
                {t('dashboard_first_set')}
              </Link>
              <Link href="/agenda" className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary">
                <CalendarPlus className="h-4 w-4" />
                {t('dashboard_plan_session')}
              </Link>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
