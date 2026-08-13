'use client';

import Link from 'next/link';
import { ArrowUpRight, BookOpen, Clock3, Flame, Target, Trophy } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { GamificationPanel } from '@/components/GamificationPanel';
import { useTranslation } from '@/lib/useTranslation';

const DAYS = [
  { day: 'ma', value: 34 }, { day: 'di', value: 52 }, { day: 'wo', value: 18 },
  { day: 'do', value: 68 }, { day: 'vr', value: 45 }, { day: 'za', value: 82 }, { day: 'zo', value: 29 },
];
const SUBJECTS = [
  { name: 'Biologie', value: 93, color: 'bg-emerald-500' },
  { name: 'Engels', value: 78, color: 'bg-sky-500' },
  { name: 'Scheikunde', value: 55, color: 'bg-amber-500' },
  { name: 'Natuurkunde', value: 41, color: 'bg-rose-500' },
];
const DAY_KEYS: Record<string, string> = {
  ma: 'stats_day_mon', di: 'stats_day_tue', wo: 'stats_day_wed', do: 'stats_day_thu',
  vr: 'stats_day_fri', za: 'stats_day_sat', zo: 'stats_day_sun',
};

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const metrics: [string, string, typeof Clock3][] = [
    ['2u 48m', 'analytics_metric_time', Clock3],
    ['127', 'analytics_metric_reviewed', BookOpen],
    [t('stats_streak_value', undefined, { n: 12 }), 'analytics_metric_streak', Flame],
    ['68%', 'analytics_metric_mastery', Target],
  ];
  return (
    <AppShell>
      <PageHeader eyebrow={t('analytics_eyebrow')} title={t('analytics_title')} description={t('analytics_description')} action={<Link href="/analytics/fsrs" className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">{t('analytics_fsrs_link')} <ArrowUpRight className="h-4 w-4" /></Link>} />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([value, labelKey, Icon]) => { const MetricIcon = Icon as typeof Clock3; return <div key={labelKey} className="rounded-xl border border-border bg-card p-5"><MetricIcon className="h-4 w-4 text-muted-foreground" /><p className="mt-4 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{t(labelKey)}</p></div>; })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-end justify-between"><div><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t('analytics_activity')}</p><h2 className="mt-2 font-display text-2xl font-semibold">{t('analytics_week_time')}</h2></div><span className="text-xs text-muted-foreground">{t('analytics_week_note')}</span></div>
          <div className="mt-8 flex h-48 items-end gap-3">{DAYS.map((item) => <div key={item.day} className="flex flex-1 flex-col items-center gap-2"><div className="relative flex h-40 w-full items-end rounded-sm bg-secondary"><div className="w-full rounded-sm bg-foreground/70 transition-all" style={{ height: `${item.value}%` }} /></div><span className="text-[11px] text-muted-foreground">{t(DAY_KEYS[item.day])}</span></div>)}</div>
        </section>
        <section className="rounded-xl border border-border bg-card p-6"><div className="flex items-center justify-between"><div><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t('analytics_mastery_section')}</p><h2 className="mt-2 font-display text-2xl font-semibold">{t('analytics_per_subject')}</h2></div><span className="text-xs text-muted-foreground">{t('analytics_subject_note')}</span></div><div className="mt-7 space-y-5">{SUBJECTS.map((subject) => <div key={subject.name}><div className="mb-2 flex justify-between text-sm"><span>{subject.name}</span><span className="tabular-nums text-muted-foreground">{subject.value}%</span></div><div className="h-1.5 rounded-full bg-secondary"><div className={`h-full rounded-full ${subject.color}`} style={{ width: `${subject.value}%` }} /></div></div>)}</div></section>
      </div>

      <div className="mt-6"><GamificationPanel /></div>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Trophy className="h-4 w-4" /> {t('analytics_footer')}</div>
    </AppShell>
  );
}
