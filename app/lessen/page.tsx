'use client';

import { useState } from 'react';
import { AppShell, PageHeader, SearchField } from '@/components/AppShell';
import { LESSONS } from '@/lib/aether-data';
import { useTranslation } from '@/lib/i18n';

export default function LessenPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const list = LESSONS.filter((l) =>
    `${l.title} ${l.subject}`.toLowerCase().includes(q.trim().toLowerCase())
  );

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
        {list.map((l) => (
          <li key={l.title} className="flex flex-wrap items-center gap-4 py-5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {l.subject}
              </p>
              <p className="mt-1 truncate text-[15px] font-semibold">{l.title}</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {t('lessons_meta', undefined, { minutes: l.minutes, level: l.level })}
            </span>
            <button
              type="button"
              className="h-8 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
            >
              {t('lessons_start')}
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="py-10 text-sm text-muted-foreground">{t('lessons_empty')}</li>
        )}
      </ul>
    </AppShell>
  );
}
