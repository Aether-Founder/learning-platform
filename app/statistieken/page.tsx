'use client';

import { AppShell, PageHeader } from '@/components/AppShell';
import { BarChart, Panel } from '@/components/ui-kit';
import { MINUTES_PER_DAY } from '@/lib/os-data';

export default function StatistiekenPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Inzichten"
        title="Statistieken"
        description="Bekijk je studiepatronen, voortgang over tijd en waar je de meeste tijd aan besteedt."
      />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Panel title="Studietijd deze week">
          <BarChart
            values={MINUTES_PER_DAY}
            labels={['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']}
            height={160}
          />
          <p className="mt-4 text-xs text-muted-foreground">Gemiddeld 24 minuten per dag</p>
        </Panel>

        <Panel title="Overzicht">
          <dl className="divide-y divide-border">
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">Totaal gestudeerd</dt>
              <dd className="font-medium tabular-nums">2u 48m</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">Kaarten herhaald</dt>
              <dd className="font-medium tabular-nums">127</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">Streak</dt>
              <dd className="font-medium tabular-nums">12 dagen</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">Sets voltooid</dt>
              <dd className="font-medium tabular-nums">3</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </AppShell>
  );
}
