'use client';

import Link from 'next/link';
import { AppShell, Meter, PageHeader } from '@/components/AppShell';
import { useUser, useUserProfile } from '@/hooks/useAuth';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';
import { useEffect, useState } from 'react';
import { GradeOnboardingModal } from '@/components/GradeOnboardingModal';

const supabase = browserClient as any;

type Subject = {
  slug: string;
  name: string;
  level: string;
  topicsDone: number;
  topics: number;
  sets: number;
  due: number;
  mastery: number;
  teacher: string;
  children: any[];
};

export default function VakkenIndex() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { profile } = useUserProfile();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch subjects:', error);
      } else {
        setSubjects(data || []);
        // Show setup modal only if no subjects exist AND user is from Netherlands or Belgium
        if (!data || data.length === 0) {
          // Check if user is from Netherlands or Belgium
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const dutchTimezones = ['Europe/Amsterdam', 'Europe/Brussels'];
          const dutchRegions = ['NL', 'BE'];
          
          const isDutchTimezone = dutchTimezones.includes(timeZone);
          
          const regions = navigator.languages?.length
            ? new Set(
                navigator.languages
                  .map((locale) => locale.split('-')[1]?.toUpperCase())
                  .filter(Boolean)
              )
            : new Set<string>();
          
          const isDutchRegion = dutchRegions.some((region) => regions.has(region));
          
          // Only show modal if user is from NL/BE timezone or region
          if (isDutchTimezone || isDutchRegion) {
            setShowSetupModal(true);
          }
        }
      }
      setLoading(false);
    };

    fetchSubjects();
  }, [user]);

  const handleSetupComplete = async (grade: string, track: string | null) => {
    setShowSetupModal(false);
    // Refresh subjects after setup
    if (user) {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!error) {
        setSubjects(data || []);
      }
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={t('subjects_eyebrow')}
          title={t('subjects_title')}
          description={t('subjects_description')}
        />
        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 text-center text-muted-foreground">Laden...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('subjects_eyebrow')}
        title={t('subjects_title')}
        description={t('subjects_description')}
      />

      {showSetupModal && (
        <GradeOnboardingModal
          currentGrade={profile?.grade_level}
          currentTrack={profile?.track}
          confirmedYear={profile?.grade_confirmed_year}
          onComplete={handleSetupComplete}
        />
      )}

      {subjects.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-lg border border-border p-10">
          <div className="text-center">
            <p className="text-lg font-medium">{t('vakken_empty_title')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('vakken_empty_desc')}</p>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Link
              key={s.slug}
              href={`/vakken/${s.slug}`}
              className="bg-background p-6 transition-colors hover:bg-secondary/50"
            >
              <h2 className="mt-2 font-display text-2xl font-semibold">{s.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.children?.length || 0} mappen · {s.sets || 0} sets
              </p>
              <div className="mt-5">
                <div className="mb-1.5 flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>
                    {s.topicsDone || 0} van {s.topics || 0} onderwerpen
                  </span>
                  <span className="tabular-nums">{s.mastery || 0}%</span>
                </div>
                <Meter value={s.mastery || 0} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {s.due === 0
                  ? t('subjects_due_clear')
                  : t('subjects_due_pending', undefined, { due: s.due || 0 })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
