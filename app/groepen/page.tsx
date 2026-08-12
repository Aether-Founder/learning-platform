'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { PrimaryButton } from '@/components/ui-kit';
import { GROUPS } from '@/lib/aether-data';
import { useTranslation } from '@/lib/i18n';

export default function GroepenPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <PageHeader
        eyebrow={t('groups_eyebrow')}
        title={t('groups_title')}
        description={t('groups_description')}
        action={<PrimaryButton>{t('groups_create')}</PrimaryButton>}
      />

      <div className="mt-10 divide-y divide-border rounded-lg border border-border">
        {GROUPS.map((g) => (
          <div
            key={g.name}
            className="flex flex-wrap items-center justify-between gap-4 p-6 transition-colors hover:bg-secondary/50"
          >
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl font-semibold">{g.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('groups_meta', undefined, { members: g.members, activity: g.activity })}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
            >
              {t('groups_open')}
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
