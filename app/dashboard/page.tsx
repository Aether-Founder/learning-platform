'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarPlus, FilePlus2 } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useRequireAuth, useUserProfile } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, loading: userLoading } = useRequireAuth('/dashboard');
  const { profile, loading: profileLoading } = useUserProfile();
  const [studySetCount, setStudySetCount] = useState<number | null>(null);
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let cancelled = false;

    async function loadCounts() {
      const client = supabase as any;
      const [{ count: sets }, { count: sessions }] = await Promise.all([
        client.from('study_sets').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        client.from('study_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);
      if (!cancelled) {
        setStudySetCount(sets ?? 0);
        setSessionCount(sessions ?? 0);
      }
    }

    loadCounts().catch(() => {
      if (!cancelled) {
        setStudySetCount(0);
        setSessionCount(0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'student';
  const loading = userLoading || profileLoading;

  // Check if this is the first visit for welcome message
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [storedDisplayName, setStoredDisplayName] = useState<string>('');
  
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore) {
      setIsFirstVisit(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
    
    // Store username locally for persistence
    if (displayName && displayName !== 'student') {
      localStorage.setItem('username', displayName);
      setStoredDisplayName(displayName);
    } else {
      const savedUsername = localStorage.getItem('username');
      if (savedUsername) {
        setStoredDisplayName(savedUsername);
      }
    }
  }, [displayName]);

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('dashboard_eyebrow')}
        title={loading ? t('dashboard_welcome') : (isFirstVisit ? `Welkom, ${displayName}` : t('dashboard_welcome_name', undefined, { name: storedDisplayName || displayName }))}
        description={t('dashboard_description')}
      />

      <section className="grid gap-4 py-8 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t('dashboard_study_sets')}</p>
          <p className="mt-3 font-display text-4xl font-semibold">{studySetCount ?? '—'}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t('dashboard_study_sets_desc')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t('dashboard_sessions')}</p>
          <p className="mt-3 font-display text-4xl font-semibold">{sessionCount ?? '—'}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t('dashboard_sessions_desc')}</p>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-2xl font-semibold">{t('dashboard_recent_activity')}</h2>
        {sessionCount === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t('dashboard_no_sessions')}</p> : <p className="mt-3 text-sm text-muted-foreground">{t('dashboard_session_count', undefined, { n: sessionCount ?? 0 })}</p>}
      </section>

      {studySetCount === 0 && sessionCount === 0 && (
        <section className="rounded-xl border border-dashed border-border p-8 text-center">
          <BookOpen className="mx-auto h-9 w-9 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl font-semibold">{t('dashboard_empty_title')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{t('dashboard_empty_desc')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/decks" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
              <FilePlus2 className="h-4 w-4" />
              {t('dashboard_first_set')}
            </Link>
            <Link href="/calendar" className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary">
              <CalendarPlus className="h-4 w-4" />
              {t('dashboard_plan_session')}
            </Link>
          </div>
        </section>
      )}
    </AppShell>
  );
}
