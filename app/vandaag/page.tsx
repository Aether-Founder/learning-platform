'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Flame,
  Target,
  AlertTriangle,
  BookOpen,
  Brain,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { supabase as browserClient } from '@/lib/supabase/client';

const supabase = browserClient as any;

type DashboardStats = {
  totalMinutes: number;
  streak: number;
  averageMastery: number;
  openTasks: number;
  dueReviews: number;
  dueErrors: number;
  weeklyMinutes: number[];
};

type UpcomingTest = {
  id: string;
  vak: string;
  titel: string;
  datum: string;
  status: 'safe' | 'warning' | 'danger';
};

type SubjectDanger = {
  id: string;
  name: string;
  mastery: number;
  errorCount: number;
};

type Recommendation = {
  id: string;
  type: 'error' | 'calendar' | 'study';
  title: string;
  description: string;
};

export default function VandaagPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalMinutes: 0,
    streak: 0,
    averageMastery: 0,
    openTasks: 0,
    dueReviews: 0,
    dueErrors: 0,
    weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
  });
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([]);
  const [subjectsInDanger, setSubjectsInDanger] = useState<SubjectDanger[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Fetch study sessions for stats
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(100);

      // Fetch subjects for mastery
      const { data: subjects } = await supabase.from('subjects').select('*').eq('user_id', user.id);

      // Fetch spaced repetition items due today
      const today = new Date().toISOString().split('T')[0];
      const { data: spacedItems } = await supabase
        .from('spaced_repetition_items')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review', today);

      // Fetch error log items due today
      const { data: errorItems } = await supabase
        .from('error_log')
        .select('*')
        .eq('user_id', user.id)
        .lte('volgende_herhaling', today);

      // Fetch calendar events for upcoming tests
      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .in('event_type', ['toets', 'examen'])
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(5);

      // Calculate stats
      const totalMinutes =
        sessions?.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) || 0;
      const averageMastery =
        subjects?.length > 0
          ? Math.round(
              subjects.reduce((sum: number, s: any) => sum + s.mastery, 0) / subjects.length
            )
          : 0;

      // Calculate weekly minutes
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const weeklyMinutes = [0, 0, 0, 0, 0, 0, 0];
      sessions?.forEach((session: any) => {
        const sessionDate = new Date(session.started_at);
        if (sessionDate >= weekStart) {
          const dayIndex = sessionDate.getDay();
          weeklyMinutes[dayIndex] += session.duration_minutes || 0;
        }
      });

      // Calculate streak
      const streak = calculateStreak(sessions || []);

      // Get subjects in danger (mastery < 60%)
      const dangerSubjects =
        subjects
          ?.filter((s: any) => s.mastery < 60)
          .map((s: any) => ({
            id: s.id,
            name: s.name,
            mastery: s.mastery,
            errorCount: errorItems?.filter((e: any) => e.vak === s.name).length || 0,
          })) || [];

      // Get upcoming tests
      const tests =
        events?.map((e: any) => {
          const daysUntil = Math.ceil(
            (new Date(e.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          let status: 'safe' | 'warning' | 'danger' = 'safe';
          if (daysUntil <= 3) status = 'danger';
          else if (daysUntil <= 7) status = 'warning';

          return {
            id: e.id,
            vak: e.subject_id || 'Algemeen',
            titel: e.title,
            datum: e.event_date,
            status,
          };
        }) || [];

      // Generate recommendations
      const recs: Recommendation[] = [];
      if (dangerSubjects.length > 0) {
        recs.push({
          id: '1',
          type: 'error',
          title: `${dangerSubjects[0].name} herhalen`,
          description: `Je meesterschap in ${dangerSubjects[0].name} is ${dangerSubjects[0].mastery}%. Focus hierop vandaag.`,
        });
      }
      if (spacedItems && spacedItems.length > 0) {
        recs.push({
          id: '2',
          type: 'study',
          title: 'Herhalingen uitvoeren',
          description: `Je hebt ${spacedItems.length} items die vandaag herhaald moeten worden.`,
        });
      }
      if (errorItems && errorItems.length > 0) {
        recs.push({
          id: '3',
          type: 'error',
          title: 'Foutenreview',
          description: `Je hebt ${errorItems.length} fouten die herhaald moeten worden.`,
        });
      }

      setStats({
        totalMinutes,
        streak,
        averageMastery,
        openTasks: 0, // TODO: integrate with tasks table
        dueReviews: spacedItems?.length || 0,
        dueErrors: errorItems?.length || 0,
        weeklyMinutes,
      });
      setUpcomingTests(tests);
      setSubjectsInDanger(dangerSubjects);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueDays = new Set(sessions.map((s) => new Date(s.started_at).toDateString()));

    if (uniqueDays.size === 0) return 0;

    const studiedToday = sessions.some((s) => {
      const date = new Date(s.started_at);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === today.getTime();
    });

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const studiedYesterday = sessions.some((s) => {
      const date = new Date(s.started_at);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === yesterday.getTime();
    });

    if (!studiedToday && !studiedYesterday) return 0;

    let streak = 0;
    const checkDate = studiedToday ? today : yesterday;

    while (true) {
      const hasSession = sessions.some((s) => {
        const date = new Date(s.started_at);
        date.setHours(0, 0, 0, 0);
        return date.getTime() === checkDate.getTime();
      });

      if (hasSession) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}u ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Dashboard"
          title="Vandaag"
          description="Je dagelijkse leeroverzicht en actiepunten"
        />
        <div className="mt-10 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg border border-border bg-card" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg border border-border bg-card" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard"
        title="Vandaag"
        description="Je dagelijkse leeroverzicht en actiepunten"
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-4">
        {/* Left Column - Empty Space */}
        <div className="hidden lg:block"></div>

        {/* Middle Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/quiz/daily">
              <Button className="w-full h-auto py-6 flex flex-col gap-2">
                <Brain className="h-6 w-6" />
                <span>Start Daily Quiz</span>
                <span className="text-xs opacity-70">{stats.dueReviews} herhalingen</span>
              </Button>
            </Link>
            <Link href="/spaced-repetition">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                <Target className="h-6 w-6" />
                <span>Spaced Repetition</span>
                <span className="text-xs opacity-70">{stats.dueReviews} items</span>
              </Button>
            </Link>
            <Link href="/foutenlogboek">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                <AlertTriangle className="h-6 w-6" />
                <span>Foutenreview</span>
                <span className="text-xs opacity-70">{stats.dueErrors} fouten</span>
              </Button>
            </Link>
          </div>

          {/* Today's Overview */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Vandaag</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Herhalingen</span>
                </div>
                <span className="font-semibold">{stats.dueReviews}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Fouten opnieuw maken</span>
                </div>
                <span className="font-semibold">{stats.dueErrors}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span>Geschatte tijd</span>
                </div>
                <span className="font-semibold">
                  {formatMinutes(stats.dueReviews * 2 + stats.dueErrors * 3)}
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Tests */}
          {upcomingTests.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Aanstaande toetsen</h2>
              <div className="space-y-3">
                {upcomingTests.map((test) => {
                  const daysUntil = Math.ceil(
                    (new Date(test.datum).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={test.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium">{test.titel}</p>
                        <p className="text-sm text-muted-foreground">Over {daysUntil} dagen</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          test.status === 'danger'
                            ? 'bg-red-500/10 text-red-600'
                            : test.status === 'warning'
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-green-500/10 text-green-600'
                        }`}
                      >
                        {test.status === 'danger'
                          ? 'Gevaar'
                          : test.status === 'warning'
                            ? 'Let op'
                            : 'Veilig'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subjects in Danger Zone */}
          {subjectsInDanger.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Vakken in gevarenzone</h2>
              <div className="space-y-3">
                {subjectsInDanger.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Meesterschap: {subject.mastery}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${subject.mastery < 40 ? 'bg-red-500' : subject.mastery < 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${subject.mastery}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {subject.errorCount} fouten
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Aanbevelingen</h2>
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    {rec.type === 'error' && (
                      <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    )}
                    {rec.type === 'calendar' && (
                      <Calendar className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    {rec.type === 'study' && (
                      <BookOpen className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{rec.title}</p>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stats Sidebar */}
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Totale tijd</span>
              </div>
              <p className="font-display text-2xl font-semibold">
                {formatMinutes(stats.totalMinutes)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-muted-foreground">Streak</span>
              </div>
              <p className="font-display text-2xl font-semibold">{stats.streak} dagen</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Meesterschap</span>
              </div>
              <p className="font-display text-2xl font-semibold">{stats.averageMastery}%</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Herhalingen</span>
              </div>
              <p className="font-display text-2xl font-semibold">{stats.dueReviews}</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
