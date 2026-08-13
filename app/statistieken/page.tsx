'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Panel } from '@/components/ui-kit';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';
import { Clock, Flame, BookOpen, Target, Calendar } from 'lucide-react';

const supabase = browserClient as any;

export default function StatistiekenPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMinutes: 0,
    cardsReviewed: 0,
    streak: 0,
    setsCompleted: 0,
    weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
    subjectProgress: [] as any[],
    recentSessions: [] as any[],
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch study sessions
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(100);

    // Fetch subjects
    const { data: subjects } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id);

    // Fetch card reviews
    const { data: reviews } = await supabase
      .from('card_reviews')
      .select('*')
      .eq('user_id', user.id);

    if (sessions) {
      const totalMinutes = sessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0);
      const cardsReviewed = sessions.reduce((sum: number, s: any) => sum + (s.cards_studied || 0), 0);
      
      // Calculate weekly data
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const weeklyMinutes = [0, 0, 0, 0, 0, 0, 0];
      sessions.forEach((session: any) => {
        const sessionDate = new Date(session.started_at);
        if (sessionDate >= weekStart) {
          const dayIndex = sessionDate.getDay();
          weeklyMinutes[dayIndex] += session.duration_minutes || 0;
        }
      });

      // Calculate streak
      const streak = calculateStreak(sessions);

      // Calculate subject progress
      const subjectProgress = subjects?.map((subject: any) => {
        const subjectSessions = sessions.filter((s: any) => s.subject_id === subject.id);
        const subjectMinutes = subjectSessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0);
        const subjectCards = subjectSessions.reduce((sum: number, s: any) => sum + (s.cards_studied || 0), 0);
        return {
          name: subject.name,
          minutes: subjectMinutes,
          cards: subjectCards,
          mastery: subject.mastery,
        };
      }) || [];

      setStats({
        totalMinutes,
        cardsReviewed,
        streak,
        setsCompleted: sessions.filter((s: any) => s.cards_studied > 0).length,
        weeklyMinutes,
        subjectProgress,
        recentSessions: sessions.slice(0, 5),
      });
    }

    setLoading(false);
  };

  const calculateStreak = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const uniqueDays = new Set(
      sessions.map(s => new Date(s.started_at).toDateString())
    );
    
    if (uniqueDays.size === 0) return 0;

    // Check if studied today or yesterday
    const studiedToday = sessions.some(s => {
      const date = new Date(s.started_at);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === today.getTime();
    });

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const studiedYesterday = sessions.some(s => {
      const date = new Date(s.started_at);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === yesterday.getTime();
    });

    if (!studiedToday && !studiedYesterday) return 0;

    // Calculate consecutive days
    let streak = 0;
    const checkDate = studiedToday ? today : yesterday;
    
    while (true) {
      const hasSession = sessions.some(s => {
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

  const days = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
  const maxWeeklyMinutes = Math.max(...stats.weeklyMinutes, 1);

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={t('stats_eyebrow')}
          title={t('stats_title')}
          description={t('stats_description')}
        />
        <div className="mt-10 text-center text-sm text-muted-foreground">Laden...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('stats_eyebrow')}
        title={t('stats_title')}
        description={t('stats_description')}
      />

      <div className="mt-10 space-y-6">
        {/* Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('stats_total_time')}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{formatMinutes(stats.totalMinutes)}</p>
              </div>
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('stats_cards_reviewed')}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{stats.cardsReviewed}</p>
              </div>
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('stats_streak')}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{stats.streak} dagen</p>
              </div>
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('stats_sets_done')}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{stats.setsCompleted}</p>
              </div>
            </div>
          </Panel>
        </div>

        {/* Weekly Chart */}
        <Panel title={t('stats_week_time')}>
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-2 h-48">
              {stats.weeklyMinutes.map((minutes, index) => {
                const height = maxWeeklyMinutes > 0 ? (minutes / maxWeeklyMinutes) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-secondary rounded-t-lg relative" style={{ height: `${Math.max(height, 4)}%` }}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium">
                        {minutes > 0 && formatMinutes(minutes)}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{days[index]}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {stats.totalMinutes > 0 
                ? `Totaal deze week: ${formatMinutes(stats.weeklyMinutes.reduce((a, b) => a + b, 0))}`
                : 'Nog geen studieactiviteiten deze week'
              }
            </p>
          </div>
        </Panel>

        {/* Subject Progress */}
        <Panel title="Voortgang per vak">
          {stats.subjectProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nog geen vakken toegevoegd.
            </p>
          ) : (
            <div className="space-y-4">
              {stats.subjectProgress.map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{subject.name}</span>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatMinutes(subject.minutes)}</span>
                      <span>{subject.cards} kaarten</span>
                      <span>{subject.mastery}% beheersing</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${subject.mastery}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Recent Sessions */}
        <Panel title="Recente sessies">
          {stats.recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nog geen sessies geregistreerd.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentSessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(session.started_at).toLocaleDateString('nl-NL', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.cards_studied} kaarten bekeken
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatMinutes(session.duration_minutes || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.cards_correct || 0}/{session.cards_studied || 0} correct
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
