'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { Panel } from '@/components/ui-kit';
import { useTranslation } from '@/lib/i18n';

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
          <p className="text-sm text-muted-foreground">{t('stats_empty')}</p>
        </Panel>

        <Panel title={t('stats_overview')}>
          <dl className="divide-y divide-border">
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{t('stats_total_time')}</dt>
              <dd className="font-medium tabular-nums">0u 0m</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{t('stats_cards_reviewed')}</dt>
              <dd className="font-medium tabular-nums">0</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{t('stats_streak')}</dt>
              <dd className="font-medium tabular-nums">{t('stats_streak_value', undefined, { n: 0 })}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{t('stats_sets_done')}</dt>
              <dd className="font-medium tabular-nums">0</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </AppShell>
  );
}
