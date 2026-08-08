'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppShell, Meter, PageHeader } from '@/components/AppShell';
import { Badge, GhostButton, Panel, Tabs, fmt, gradeTone } from '@/components/ui-kit';
import { GRADEBOOK, OVERALL_AVERAGE, averageOf } from '@/lib/os-data';

const VIEWS = [
  { value: 'vakken', label: 'Per vak' },
  { value: 'matrix', label: 'Alle cijfers' },
  { value: 'periodes', label: 'Periodes' },
] as const;
type View = (typeof VIEWS)[number]['value'];

const MAX_TOETSEN = Math.max(...GRADEBOOK.map((s) => s.grades.length));

export default function CijfersPage() {
  const [view, setView] = useState<View>('vakken');
  const [period, setPeriod] = useState<0 | 1 | 2 | 3 | 4>(0);

  const rows = useMemo(
    () =>
      GRADEBOOK.map((s) => {
        const grades = period === 0 ? s.grades : s.grades.filter((g) => g.period === period);
        return { ...s, grades, avg: averageOf(grades) };
      }),
    [period]
  );

  const scored = rows.filter((r) => r.avg !== null);
  const best = scored.reduce((a, b) => ((a.avg ?? 0) > (b.avg ?? 0) ? a : b), scored[0]!);
  const worst = scored.reduce((a, b) => ((a.avg ?? 10) < (b.avg ?? 10) ? a : b), scored[0]!);
  const insufficient = scored.filter((r) => (r.avg ?? 0) < 5.5).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Resultaten"
        title="Cijfers"
        description="Alle toetsen, wegingen en gemiddelden van dit schooljaar. Open een vak voor de volledige lijst en de streefcijfer-rekenhulp."
        action={
          <div className="text-right">
            <p className="font-display text-5xl font-semibold leading-none tabular-nums">
              {fmt(OVERALL_AVERAGE)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Gemiddeld
            </p>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-6">
        <Tabs tabs={VIEWS} value={view} onChange={setView} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Periode
          </span>
          {([0, 1, 2, 3, 4] as const).map((p) => (
            <GhostButton key={p} active={period === p} onClick={() => setPeriod(p)}>
              {p === 0 ? 'Alles' : `P${p}`}
            </GhostButton>
          ))}
        </div>
      </div>

      <div className="grid gap-4 border-b border-border pb-8 sm:grid-cols-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Vakken</p>
          <p className="mt-1 font-display text-3xl font-semibold">{GRADEBOOK.length}</p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Hoogste</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
            {fmt(best?.avg ?? null)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{best?.name}</p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Laagste</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
            {fmt(worst?.avg ?? null)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{worst?.name}</p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Onvoldoendes
          </p>
          <p className="mt-1 font-display text-3xl font-semibold">{insufficient}</p>
          <p className="mt-1 text-xs text-muted-foreground">gemiddelden onder 5,5</p>
        </Panel>
      </div>

      <div className="pt-8">
        {view === 'vakken' && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Vak</th>
                  <th className="px-5 py-3 font-medium">Docent</th>
                  <th className="px-5 py-3 font-medium">Toetsen</th>
                  <th className="px-5 py-3 font-medium">Voortgang naar streefcijfer</th>
                  <th className="px-5 py-3 text-right font-medium">Streef</th>
                  <th className="px-5 py-3 text-right font-medium">Gem.</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => (
                  <tr key={s.slug} className="transition-colors hover:bg-secondary/40">
                    <td className="px-5 py-4 font-semibold">{s.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{s.teacher}</td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">
                      {s.grades.filter((g) => g.grade !== null).length} van {s.grades.length}
                    </td>
                    <td className="px-5 py-4">
                      <Meter value={Math.min(((s.avg ?? 0) / s.target) * 100, 100)} />
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-muted-foreground">
                      {fmt(s.target)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Badge tone={gradeTone(s.avg)}>{fmt(s.avg)}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/cijfers/${s.slug}`}
                        className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
                      >
                        Openen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'matrix' && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="sticky left-0 bg-background px-5 py-3 font-medium">Vak</th>
                  {Array.from({ length: MAX_TOETSEN }, (_, i) => (
                    <th key={i} className="px-4 py-3 text-center font-medium">
                      T{i + 1}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right font-medium">Gem.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => (
                  <tr key={s.slug} className="transition-colors hover:bg-secondary/40">
                    <td className="sticky left-0 bg-background px-5 py-4 font-semibold">
                      {s.name}
                    </td>
                    {Array.from({ length: MAX_TOETSEN }, (_, i) => {
                      const g = s.grades[i];
                      return (
                        <td key={i} className="px-4 py-4 text-center">
                          {g ? (
                            <span
                              title={`${g.name} · weging ${g.weight}`}
                              className={
                                'tabular-nums ' +
                                (g.grade === null
                                  ? 'text-muted-foreground'
                                  : g.grade < 5.5
                                    ? 'text-warning'
                                    : '')
                              }
                            >
                              {fmt(g.grade)}
                              <span className="ml-1 text-[10px] text-muted-foreground">
                                ×{g.weight}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">·</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-5 py-4 text-right">
                      <Badge tone={gradeTone(s.avg)}>{fmt(s.avg)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'periodes' && (
          <div className="grid gap-6 md:grid-cols-2">
            {GRADEBOOK.map((s) => (
              <Panel
                key={s.slug}
                title={s.name}
                action={
                  <Badge tone={gradeTone(averageOf(s.grades))}>{fmt(averageOf(s.grades))}</Badge>
                }
              >
                <dl className="divide-y divide-border">
                  {([1, 2, 3, 4] as const).map((p) => {
                    const list = s.grades.filter((g) => g.period === p);
                    return (
                      <div
                        key={p}
                        className="flex items-center justify-between gap-4 py-2.5 text-sm"
                      >
                        <dt className="text-muted-foreground">Periode {p}</dt>
                        <dd className="font-medium tabular-nums">
                          {list.length ? (
                            <span>{fmt(averageOf(list))}</span>
                          ) : (
                            <span className="text-muted-foreground">nog geen cijfers</span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
