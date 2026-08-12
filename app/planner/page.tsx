'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { Badge } from '@/components/ui-kit';
import { TASKS, TASK_COLUMNS } from '@/lib/os-data';
import { useTranslation } from '@/lib/i18n';

const STATUS_KEYS: Record<string, string> = {
  todo: 'planner_status_todo',
  bezig: 'planner_status_doing',
  review: 'planner_status_review',
  klaar: 'planner_status_done',
};

export default function PlannerPage() {
  const { t, currentLanguage } = useTranslation();
  const dateLocale = currentLanguage === 'nl' ? 'nl-NL' : 'en-US';
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
        {TASK_COLUMNS.map((status) => {
          const tasks = TASKS.filter((t) => t.status === status);
          return (
            <div key={status} className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">{t(STATUS_KEYS[status])}</h2>
                <span className="text-xs text-muted-foreground">{tasks.length}</span>
              </div>
              <div className="space-y-3">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary/50"
                  >
                    <p className="font-medium leading-snug">{t.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t.subject}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(t.due).toLocaleDateString(dateLocale, {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <Badge tone={t.priority === 'hoog' ? 'warning' : 'muted'}>{t.estimate}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
