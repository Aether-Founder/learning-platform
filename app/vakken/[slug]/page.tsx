'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Badge } from '@/components/ui-kit';
import { findSubject, countSets } from '@/lib/aether-data';
import { useTranslation } from '@/lib/i18n';

export default function SubjectPage() {
  const { t } = useTranslation();
  const params = useParams();
  const slug = params.slug as string;
  const subject = findSubject(slug);

  if (!subject) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={t('subject_eyebrow')}
          title={t('subject_not_found')}
          description={t('subject_not_found_desc')}
        />
        <div className="mt-8">
          <Link
            href="/vakken"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
          >
            {t('subject_back')}
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={subject.level}
        title={subject.name}
        description={t('subject_description', undefined, { folders: subject.children.length, sets: countSets(subject.children), teacher: subject.teacher })}
        action={
          <div className="flex flex-col gap-2">
            <Badge tone={subject.due === 0 ? 'success' : 'warning'}>
              {subject.due === 0 ? t('subject_due_clear') : t('subject_due', undefined, { due: subject.due })}
            </Badge>
            <p className="text-xs text-muted-foreground text-right">
              {t('subject_mastery', undefined, { mastery: subject.mastery })}
            </p>
          </div>
        }
      />

      {subject.children.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold">{t('subject_empty')}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('subject_empty_desc')}
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {subject.children.map((folder) => (
            <div key={folder.slug} className="bg-background p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {folder.kind === 'folder' ? t('subject_kind_folder') : t('subject_kind_set')}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-semibold">{folder.name}</h3>
                  {folder.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{folder.description}</p>
                  )}
                  {folder.children && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t('subject_sets', undefined, { n: countSets(folder.children) })}
                    </p>
                  )}
                  {folder.cards && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t('subject_cards', undefined, { n: folder.cards.length })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/vakken"
          className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
        >
          {t('subject_back')}
        </Link>
      </div>
    </AppShell>
  );
}
