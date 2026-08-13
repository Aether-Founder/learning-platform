'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { useTranslation } from '@/lib/i18n';

const STATUS_KEYS: Record<string, string> = {
  todo: 'planner_status_todo',
  bezig: 'planner_status_doing',
  review: 'planner_status_review',
  klaar: 'planner_status_done',
};

export default function PlannerPage() {
  const { t } = useTranslation();
  const tasks: any[] = []; // Geen hardcoded taken meer
  
  return (
    <AppShell>
      <PageHeader
        eyebrow={t('planner_eyebrow')}
        title={t('planner_title')}
        description={t('planner_description')}
        action={
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t('planner_new_task')}
          </button>
        }
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-4">
        {Object.keys(STATUS_KEYS).map((status) => (
          <div key={status} className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">{t(STATUS_KEYS[status])}</h2>
              <span className="text-xs text-muted-foreground">0</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t('planner_empty')}</p>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
