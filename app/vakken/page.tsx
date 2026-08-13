'use client';

import Link from 'next/link';
import { AppShell, Meter, PageHeader } from '@/components/AppShell';
import { useUser } from '@/hooks/useAuth';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';
import { useEffect, useState } from 'react';

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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
      setLoading(false);
    };

    fetchSubjects();
  }, [user]);

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

  if (subjects.length === 0) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={t('subjects_eyebrow')}
          title={t('subjects_title')}
          description={t('subjects_description')}
        />
        <div className="mt-10 grid place-items-center rounded-lg border border-border p-10">
          <div className="text-center">
            <p className="text-lg font-medium">{t('vakken_empty_title')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('vakken_empty_desc')}</p>
          </div>
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

      <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <Link
            key={s.slug}
            href={`/vakken/${s.slug}`}
            className="bg-background p-6 transition-colors hover:bg-secondary/50"
          >
            <h2 className="mt-2 font-display text-2xl font-semibold">{s.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.sets} sets
            </p>
            <div className="mt-5">
              <div className="mb-1.5 flex items-baseline justify-between text-xs text-muted-foreground">
                <span>
                  {t('subjects_progress', undefined, { done: s.topicsDone, total: s.topics })}
                </span>
                <span className="tabular-nums">{s.mastery}%</span>
              </div>
              <Meter value={s.mastery} />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {s.due === 0
                ? t('subjects_due_clear')
                : t('subjects_due_pending', undefined, { due: s.due })}
            </p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
