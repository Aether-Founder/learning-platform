'use client';

import Link from 'next/link';
import { ArrowLeft, Brain, CalendarClock, CheckCircle2, Gauge, TrendingUp } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useTranslation } from '@/lib/useTranslation';

const REVIEWS = [
  { label: 'fsrs_rating_again', value: 14, color: 'bg-rose-500' },
  { label: 'fsrs_rating_hard', value: 22, color: 'bg-amber-500' },
  { label: 'fsrs_rating_good', value: 51, color: 'bg-emerald-500' },
  { label: 'fsrs_rating_easy', value: 13, color: 'bg-sky-500' },
];

export default function FsrsAnalyticsPage() {
  const { t } = useTranslation();
  const metrics = [
    { labelKey: 'fsrs_retrievability', value: '82%', icon: Brain },
    { labelKey: 'fsrs_stability', value: '18,4 d', icon: TrendingUp },
    { labelKey: 'fsrs_difficulty', value: '5,2', icon: Gauge },
    { labelKey: 'fsrs_reviews_today', value: '24', icon: CalendarClock },
  ];
  return (
    <AppShell>
      <PageHeader
        eyebrow={t('fsrs_eyebrow')}
        title={t('fsrs_title')}
        description={t('fsrs_description')}
        action={
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t('fsrs_back')}
          </Link>
        }
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.labelKey} className="rounded-xl border border-border bg-card p-5">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <p className="mt-4 text-2xl font-semibold tabular-nums">{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t(metric.labelKey)}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {t('fsrs_answers')}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                {t('fsrs_review_distribution')}
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">{t('fsrs_reviews_note')}</span>
          </div>
          <div className="mt-8 space-y-5">
            {REVIEWS.map((review) => (
              <div key={review.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{t(review.label)}</span>
                  <span className="tabular-nums text-muted-foreground">{review.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${review.color}`}
                    style={{ width: `${review.value * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h2 className="font-display text-2xl font-semibold">{t('fsrs_insights')}</h2>
          </div>
          <ul className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">{t('fsrs_insight_retention')}</strong>{' '}
              {t('fsrs_insight_retention_text')}
            </li>
            <li>
              <strong className="text-foreground">{t('fsrs_insight_lapses')}</strong>{' '}
              {t('fsrs_insight_lapses_text')}
            </li>
            <li>
              <strong className="text-foreground">{t('fsrs_insight_next')}</strong>{' '}
              {t('fsrs_insight_next_text')}
            </li>
          </ul>
        </section>
      </div>
      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t('fsrs_upcoming')}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">{t('fsrs_deck_stability')}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t('fsrs_note_algorithm')}</span>
        </div>
        <div className="mt-6 divide-y divide-border">
          {[
            ['Kracht, arbeid en energie', '3,2 dagen', '44 kaarten'],
            ['Irregular verbs — part II', '21,6 dagen', '38 kaarten'],
            ['Zuren & basen', '9,8 dagen', '27 kaarten'],
          ].map(([name, stability, cards]) => (
            <div
              key={name}
              className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
            >
              <span className="font-medium">{name}</span>
              <span className="text-muted-foreground">
                {t('fsrs_cards', undefined, { n: parseInt(cards, 10) })}
              </span>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{' '}
                {t('fsrs_stability_value', undefined, { stability })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
