'use client';

import { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Plus, Trash2 } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useTranslation } from '@/lib/i18n';

type Exam = { id: string; subject: string; date: string };
type StudyMoment = { id: string; exam: string; examDate: string; date: string; offset: number; task: string };

const OFFSETS = [14, 10, 7, 3, 1];
const TASK_KEYS: Record<number, string> = { 14: 'testweek_task_t14', 10: 'testweek_task_t10', 7: 'testweek_task_t7', 3: 'testweek_task_t3', 1: 'testweek_task_t1' };

function dateLabel(value: string, locale: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' });
}

function buildSchedule(exams: Exam[], t: (id: string) => string): StudyMoment[] {
  return exams.flatMap((exam) => OFFSETS.map((offset) => {
    const date = new Date(`${exam.date}T12:00:00`);
    date.setDate(date.getDate() - offset);
    return { id: `${exam.id}-${offset}`, exam: exam.subject, examDate: exam.date, date: date.toISOString().slice(0, 10), offset, task: t(TASK_KEYS[offset]) };
  })).sort((a, b) => a.date.localeCompare(b.date) || b.offset - a.offset);
}

export default function ToetsweekPage() {
  const { t, currentLanguage } = useTranslation();
  const dateLocale = currentLanguage === 'nl' ? 'nl-NL' : 'en-US';
  const [exams, setExams] = useState<Exam[]>([{ id: 'exam-1', subject: 'Natuurkunde', date: '2026-08-12' }]);
  const schedule = useMemo(() => buildSchedule(exams.filter((exam) => exam.subject && exam.date), t), [exams, t]);

  const addExam = () => setExams((current) => [...current, { id: `exam-${Date.now()}`, subject: '', date: '' }]);
  const updateExam = (id: string, updates: Partial<Exam>) => setExams((current) => current.map((exam) => exam.id === id ? { ...exam, ...updates } : exam));
  const removeExam = (id: string) => setExams((current) => current.filter((exam) => exam.id !== id));

  return (
    <AppShell>
      <PageHeader eyebrow={t('testweek_eyebrow')} title={t('testweek_title')} description={t('testweek_description')} action={<div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {t('testweek_count', undefined, { n: exams.length })}</div>} />
      <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
        <section className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between"><div><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t('testweek_my_tests')}</p><h2 className="mt-2 font-display text-2xl font-semibold">{t('testweek_exams')}</h2></div><button type="button" onClick={addExam} className="grid h-9 w-9 place-items-center rounded-md border border-border hover:bg-secondary" aria-label={t('testweek_add_aria')}><Plus className="h-4 w-4" /></button></div>
          <div className="mt-6 space-y-4">{exams.map((exam, index) => <div key={exam.id} className="rounded-lg border border-border p-4"><div className="mb-3 flex items-center justify-between"><span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t('testweek_card', undefined, { n: index + 1 })}</span>{exams.length > 1 && <button type="button" onClick={() => removeExam(exam.id)} className="text-muted-foreground hover:text-rose-500" aria-label={t('testweek_remove_aria')}><Trash2 className="h-3.5 w-3.5" /></button>}</div><label className="block text-xs text-muted-foreground">{t('testweek_subject')}<input value={exam.subject} onChange={(event) => updateExam(exam.id, { subject: event.target.value })} placeholder={t('testweek_subject_placeholder')} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40" /></label><label className="mt-3 block text-xs text-muted-foreground">{t('testweek_date')}<input type="date" value={exam.date} onChange={(event) => updateExam(exam.id, { date: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40" /></label></div>)}</div>
          <button type="button" onClick={addExam} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"><Plus className="h-4 w-4" /> {t('testweek_add_another')}</button>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between"><div><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t('testweek_plan')}</p><h2 className="mt-2 font-display text-2xl font-semibold">{t('testweek_prep')}</h2></div><span className="text-xs text-muted-foreground">{t('testweek_moments', undefined, { n: schedule.length })}</span></div>
          {schedule.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{t('testweek_empty')}</div> : <div className="relative space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-border">{schedule.map((moment) => <article key={moment.id} className="relative flex gap-4"><div className="z-10 mt-5 h-2 w-2 shrink-0 rounded-full bg-foreground ring-4 ring-background" /><div className="flex-1 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold">T-{moment.offset}</span><span className="text-xs text-muted-foreground">{dateLabel(moment.date, dateLocale)}</span></div><h3 className="mt-3 text-base font-semibold">{moment.task}</h3><p className="mt-1 text-xs text-muted-foreground">{t('testweek_moment_meta', undefined, { exam: moment.exam, date: dateLabel(moment.examDate, dateLocale) })}</p></div><BookOpen className="h-4 w-4 text-muted-foreground" /></div></div></article>)}</div>}
        </section>
      </div>
    </AppShell>
  );
}
