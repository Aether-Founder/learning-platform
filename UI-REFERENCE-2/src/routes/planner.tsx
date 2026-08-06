import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, PageHeader } from "@/components/AppShell";
import {
  Badge,
  BarChart,
  ContextMenu,
  GhostButton,
  Panel,
  PrimaryButton,
  Tabs,
} from "@/components/ui-kit";
import { MINUTES_PER_DAY, TASKS, TASK_COLUMNS, TASK_LABELS } from "@/lib/os-data";
import { SCHOOL_EVENTS } from "@/lib/aether-data";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Planner — Aether" },
      {
        name: "description",
        content:
          "Plan je week met een kanbanbord, tijdlijn en takenlijst: opdrachten, deadlines en studieblokken op één plek.",
      },
      { property: "og:title", content: "Planner — Aether" },
      {
        property: "og:description",
        content: "Kanban, tijdlijn en takenlijst voor opdrachten, deadlines en studieblokken.",
      },
    ],
  }),
  component: PlannerPage,
});

const VIEWS = [
  { value: "bord", label: "Bord" },
  { value: "lijst", label: "Lijst" },
  { value: "tijdlijn", label: "Tijdlijn" },
] as const;
type View = (typeof VIEWS)[number]["value"];

function PlannerPage() {
  const [view, setView] = useState<View>("bord");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Werkweek"
        title="Planner"
        description="Verdeel opdrachten over de week, bewaak deadlines en houd zicht op je studieblokken."
        action={<PrimaryButton>Nieuwe taak</PrimaryButton>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-6">
        <Tabs tabs={VIEWS} value={view} onChange={setView} />
        <div className="flex flex-wrap gap-2">
          <GhostButton>Deze week</GhostButton>
          <GhostButton>Op vak</GhostButton>
          <GhostButton>Op prioriteit</GhostButton>
        </div>
      </div>

      {view === "bord" && (
        <div className="grid gap-4 lg:grid-cols-4">
          {TASK_COLUMNS.map((col) => (
            <div key={col} className="rounded-lg border border-border p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {TASK_LABELS[col]}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {TASKS.filter((t) => t.status === col).length}
                </span>
              </div>
              <ContextMenu items={["Openen", "Deadline wijzigen", "Prioriteit", "Dupliceren", "Verwijderen"]}>
                <div className="space-y-2">
                  {TASKS.filter((t) => t.status === col).map((t) => (
                    <article key={t.id} className="rounded-md border border-border p-3">
                      <p className="text-[13px] font-semibold leading-snug">{t.title}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {t.subject} · {t.estimate}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <Badge tone={t.priority === "hoog" ? "warning" : "outline"}>
                          {t.priority}
                        </Badge>
                        <Badge tone="muted">{t.due.slice(5)}</Badge>
                      </div>
                    </article>
                  ))}
                  <button
                    type="button"
                    className="w-full rounded-md border border-dashed border-border py-2 text-[11px] text-muted-foreground transition-colors hover:bg-secondary/50"
                  >
                    + Taak toevoegen
                  </button>
                </div>
              </ContextMenu>
            </div>
          ))}
        </div>
      )}

      {view === "lijst" && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-5 py-3 font-medium">Taak</th>
                <th className="px-5 py-3 font-medium">Vak</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Prioriteit</th>
                <th className="px-5 py-3 font-medium">Inschatting</th>
                <th className="px-5 py-3 text-right font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TASKS.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-5 py-3.5 font-medium">{t.title}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{t.subject}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={t.status === "klaar" ? "success" : "muted"}>
                      {TASK_LABELS[t.status]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{t.priority}</td>
                  <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{t.estimate}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                    {t.due}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "tijdlijn" && (
        <div className="space-y-2.5 rounded-lg border border-border p-6">
          {TASKS.map((t, i) => (
            <div key={t.id} className="flex items-center gap-4">
              <span className="w-44 shrink-0 truncate text-xs text-muted-foreground">{t.title}</span>
              <div className="h-5 flex-1 rounded-sm bg-secondary">
                <div
                  className="h-full rounded-sm bg-foreground/60"
                  style={{ marginLeft: `${(i % 6) * 9}%`, width: `${16 + (i % 5) * 9}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <Panel title="Studietijd deze week">
          <BarChart values={MINUTES_PER_DAY} labels={["m", "d", "w", "d", "v", "z", "z"]} />
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Gemiddeld 36 minuten per dag. Zaterdag was je productiefste dag.
          </p>
        </Panel>
        <Panel title="Deadlines">
          <ul className="divide-y divide-border">
            {SCHOOL_EVENTS.filter((e) => e.type === "deadline" || e.type === "toets")
              .slice(0, 6)
              .map((e) => (
                <li key={e.title} className="py-2.5">
                  <p className="text-[13px] font-medium leading-snug">{e.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {e.subject ?? "Schoolbreed"} · {e.date}
                  </p>
                </li>
              ))}
          </ul>
        </Panel>
        <Panel title="Studieblokken">
          <ul className="divide-y divide-border">
            {[
              ["07:30 – 08:00", "Herhaling flashcards"],
              ["15:00 – 16:00", "Wiskunde B — oefenen"],
              ["16:30 – 17:00", "Woordjes Engels"],
              ["19:30 – 20:30", "Essay afronden"],
            ].map(([time, label]) => (
              <li key={time} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-muted-foreground tabular-nums">{time}</span>
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
