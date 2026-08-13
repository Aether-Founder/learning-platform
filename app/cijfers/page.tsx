'use client';

import { useMemo, useState } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Badge, Panel, Tabs } from '@/components/ui-kit';
import { useTranslation } from '@/lib/i18n';

const VIEWS = ['vakken', 'matrix', 'periodes'] as const;
type View = (typeof VIEWS)[number];

export default function CijfersPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('vakken');
  const [period, setPeriod] = useState<0 | 1 | 2 | 3 | 4>(0);

  const viewLabels: Record<View, string> = {
    vakken: t('grades_tab_subjects'),
    matrix: t('grades_tab_all'),
    periodes: t('grades_tab_periods'),
  };
  const tabs = VIEWS.map((value) => ({ value, label: viewLabels[value] }));

  // Geen hardcoded cijfers meer - alles leeg voor nieuwe gebruiker
  const rows: any[] = [];
  const scored: any[] = [];
  const best = null;
  const worst = null;
  const insufficient = 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('grades_eyebrow')}
        title={t('grades_title')}
        description={t('grades_description')}
        action={
          <div className="text-right">
            <p className="font-display text-5xl font-semibold leading-none tabular-nums">
              -,-
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {t('grades_average')}
            </p>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-6">
        <Tabs tabs={tabs} value={view} onChange={setView} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {t('grades_period')}
          </span>
          {([0, 1, 2, 3, 4] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
              }`}
            >
              {p === 0 ? t('grades_all') : `P${p}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 border-b border-border pb-8 sm:grid-cols-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('grades_subjects')}</p>
          <p className="mt-1 font-display text-3xl font-semibold">0</p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('grades_highest')}</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">-,-</p>
          <p className="mt-1 text-xs text-muted-foreground">-</p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('grades_lowest')}</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">-,-</p>
          <p className="mt-1 text-xs text-muted-foreground">-</p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {t('grades_failing')}
          </p>
          <p className="mt-1 font-display text-3xl font-semibold">0</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('grades_failing_desc')}</p>
        </Panel>
      </div>

      <div className="pt-8">
        {view === 'vakken' && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-5 py-3 font-medium">{t('grades_col_subject')}</th>
                  <th className="px-5 py-3 font-medium">{t('grades_col_teacher')}</th>
                  <th className="px-5 py-3 font-medium">{t('grades_col_tests')}</th>
                  <th className="px-5 py-3 font-medium">{t('grades_col_progress')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('grades_col_target')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('grades_col_avg')}</th>
                  <th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    {t('grades_empty_state')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {view === 'matrix' && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <p className="p-6 text-sm text-muted-foreground">{t('grades_empty_state')}</p>
          </div>
        )}

        {view === 'periodes' && (
          <div className="grid gap-6 md:grid-cols-2">
            <p className="p-6 text-sm text-muted-foreground">{t('grades_empty_state')}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
