'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { PrimaryButton } from '@/components/ui-kit';
import { useTranslation } from '@/lib/useTranslation';

export default function GroepenPage() {
  const { t } = useTranslation();
  const groups: any[] = []; // Geen hardcoded groepen meer
  
  return (
    <AppShell>
      <PageHeader
        eyebrow={t('groups_eyebrow')}
        title={t('groups_title')}
        description={t('groups_description')}
        action={<PrimaryButton>{t('groups_create')}</PrimaryButton>}
      />

      <div className="mt-10 divide-y divide-border rounded-lg border border-border">
        {groups.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">{t('groups_empty')}</div>
        )}
      </div>
    </AppShell>
  );
}
