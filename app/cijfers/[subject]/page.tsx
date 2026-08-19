'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Badge, Panel, fmt, gradeTone } from '@/components/ui-kit';
import { GRADEBOOK, averageOf } from '@/lib/os-data';
import { useTranslation } from '@/lib/useTranslation';

export default function SubjectGradesPage() {
  const { t, currentLanguage } = useTranslation();
  const dateLocale = currentLanguage === 'nl' ? 'nl-NL' : 'en-US';
  const params = useParams();
  const slug = params.subject as string;
  const subject = GRADEBOOK.find((s) => s.slug === slug);

  if (!subject) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={t('grades_eyebrow')}
          title={t('grades_subject_not_found')}
          description={t('grades_subject_not_found_desc')}
        />
        <div className="mt-8">
          <Link
            href="/cijfers"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
          >
            {t('grades_back')}
          </Link>
        </div>
      </AppShell>
    );
  }

  const avg = averageOf(subject.grades);

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('grades_title')}
        title={subject.name}
        description={t('grades_subject_desc', undefined, {
          teacher: subject.teacher,
          target: fmt(subject.target),
        })}
        action={
          <div className="text-right">
            <p className="font-display text-5xl font-semibold leading-none tabular-nums">
              {fmt(avg)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {t('grades_average')}
            </p>
          </div>
        }
      />

      <div className="mt-10">
        <Panel title={t('grades_all_tests')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="pb-3 font-medium">{t('grades_col_name')}</th>
                  <th className="pb-3 font-medium">{t('grades_col_type')}</th>
                  <th className="pb-3 font-medium">{t('grades_col_date')}</th>
                  <th className="pb-3 text-center font-medium">{t('grades_col_weight')}</th>
                  <th className="pb-3 text-center font-medium">{t('grades_col_period')}</th>
                  <th className="pb-3 text-right font-medium">{t('grades_col_grade')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subject.grades.map((g) => (
                  <tr key={g.id} className="transition-colors hover:bg-secondary/40">
                    <td className="py-3 font-medium">{g.name}</td>
                    <td className="py-3 text-muted-foreground">{g.type}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(g.date).toLocaleDateString(dateLocale, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 text-center tabular-nums text-muted-foreground">
                      {g.weight}×
                    </td>
                    <td className="py-3 text-center text-muted-foreground">P{g.period}</td>
                    <td className="py-3 text-right">
                      {g.grade === null ? (
                        <span className="text-muted-foreground">{t('grades_not_yet')}</span>
                      ) : (
                        <Badge tone={gradeTone(g.grade)}>{fmt(g.grade)}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mt-6">
          <Link
            href="/cijfers"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
          >
            {t('grades_back')}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
