'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { EmptyState, PrimaryButton } from '@/components/ui-kit';
import { useTranslation } from '@/lib/i18n';

export default function DecksPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <PageHeader
        eyebrow={t('decks_eyebrow')}
        title={t('decks_title')}
        description={t('decks_description')}
        action={<PrimaryButton>{t('decks_new')}</PrimaryButton>}
      />

      <div className="mt-10">
        <EmptyState
          title={t('decks_empty')}
          description={t('decks_empty_desc')}
          action={<PrimaryButton>{t('decks_empty_cta')}</PrimaryButton>}
        />
      </div>
    </AppShell>
  );
}
