'use client';

import { useState } from 'react';
import { AppShell, PageHeader, SearchField } from '@/components/AppShell';
import { useTranslation } from '@/lib/i18n';

export default function LessenPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const list: any[] = []; // Geen hardcoded lessen meer
  
  return (
    <AppShell>
      <PageHeader
        eyebrow={t('lessons_eyebrow')}
        title={t('lessons_title')}
        description={t('lessons_description')}
        action={
          <SearchField value={q} onChange={setQ} placeholder={t('lessons_search')} className="w-64" />
        }
      />

      <ul className="divide-y divide-border">
        {list.length === 0 && (
          <li className="py-10 text-sm text-muted-foreground">{t('lessons_empty')}</li>
        )}
      </ul>
    </AppShell>
  );
}
