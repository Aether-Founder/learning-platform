'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { BarChart, Panel } from '@/components/ui-kit';
import { MINUTES_PER_DAY } from '@/lib/os-data';
import { useTranslation } from '@/lib/i18n';

const DAY_LABEL_KEYS = [
  'stats_day_mon',
  'stats_day_tue',
  'stats_day_wed',
  'stats_day_thu',
  'stats_day_fri',
  'stats_day_sat',
  'stats_day_sun',
];

export default function StatistiekenPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <PageHeader
        eyebrow={t('stats_eyebrow')}
        title={t('stats_title')}
        description={t('stats_description')}
      />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Panel title={t('stats_week_time')}>
          <BarChart
            values={MINUTES_PER_DAY}
            labels={DAY_LABEL_KEYS.map((k) => t(k))}
            height={160}
          />
          <p className="mt-4 text-xs text-muted-foreground">{t('stats_avg_per_day')}</p>
        </Panel>

        <Panel title={t('stats_overview')}>
          <dl className="divide-y divide-border">
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{t('stats_total_time')}</dt>
              <dd className="font-medium tabular-nums">2u 48m</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{t('stats_cards_reviewed')}</dt>
              <dd className="font-medium tabular-nums">127</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{t('stats_streak')}</dt>
              <dd className="font-medium tabular-nums">{t('stats_streak_value', undefined, { n: 12 })}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{t('stats_sets_done')}</dt>
              <dd className="font-medium tabular-nums">3</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </AppShell>
  );
}
