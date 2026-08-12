import { createFileRoute } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";
import {
  Badge,
  BarChart,
  Donut,
  Heatmap,
  KeyValue,
  LineChart,
  Panel,
} from "@/components/ui-kit";
import {
  ACHIEVEMENTS,
  HEATMAP,
  MINUTES_PER_DAY,
  RETENTION_SERIES,
  SESSION_MIX,
} from "@/lib/os-data";

export const Route = createFileRoute("/statistieken")({
  head: () => ({
    meta: [
      { title: "Statistieken — Aether" },
      {
        name: "description",
        content:
          "Inzicht in je studiegedrag: retentie, studietijd, sessieverdeling, activiteitenheatmap en behaalde prestaties.",
      },
      { property: "og:title", content: "Statistieken — Aether" },
      {
        property: "og:description",
        content: "Retentie, studietijd, sessieverdeling en prestaties in één overzicht.",
      },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Inzicht"
        title="Statistieken"
        description="Hoe je leert, wanneer je leert en wat blijft hangen — teruggebracht tot een paar rustige grafieken."
      />

      <div className="grid gap-6 py-10 md:grid-cols-3">
        <Panel title="Retentie">
          <div className="flex items-center gap-6">
            <Donut value={88} label="onthouden" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Van elke tien kaarten die je herhaalt, weet je er bijna negen meteen goed.
            </p>
          </div>
        </Panel>
        <Panel title="Retentie over 12 weken">
          <LineChart values={RETENTION_SERIES} />
          <p className="mt-2 text-xs text-muted-foreground">Stijgend sinds week 5.</p>
        </Panel>
        <Panel title="Studietijd per dag">
          <BarChart values={MINUTES_PER_DAY} labels={["m", "d", "w", "d", "v", "z", "z"]} />
        </Panel>
      </div>

      <Panel title="Activiteit (26 weken)">
        <Heatmap values={HEATMAP} />
      </Panel>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Panel title="Verdeling per modus">
          <ul className="space-y-3">
            {SESSION_MIX.map((s) => (
              <li key={s.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-muted-foreground">{s.value}%</span>
                </div>
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-foreground/70" style={{ width: `${s.value}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Kerncijfers">
          <KeyValue
            items={[
              ["Streak", "12 dagen"],
              ["Sessies deze maand", "48"],
              ["Kaarten beoordeeld", "1.284"],
              ["Gemiddelde sessie", "18 min"],
              ["Beste dag", "zaterdag"],
            ]}
          />
        </Panel>
      </div>

      <section className="pt-12">
        <h2 className="mb-4 border-b border-border pb-3 font-display text-2xl font-semibold">
          Prestaties
        </h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => (
            <article key={a.name} className="bg-background p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{a.name}</h3>
                <Badge tone={a.earned ? "success" : "outline"}>{a.earned ? "behaald" : "open"}</Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a.description}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
