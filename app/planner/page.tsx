"use client";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Badge, Panel } from "@/components/ui-kit";
import { TASKS, TASK_COLUMNS, TASK_LABELS } from "@/lib/os-data";

export default function PlannerPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Taken"
        title="Planner"
        description="Kanban-bord met al je taken, opdrachten en deadlines. Sleep kaarten om de status bij te werken."
        action={
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Nieuwe taak
          </button>
        }
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-4">
        {TASK_COLUMNS.map((status) => {
          const tasks = TASKS.filter((t) => t.status === status);
          return (
            <div key={status} className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">{TASK_LABELS[status]}</h2>
                <span className="text-xs text-muted-foreground">{tasks.length}</span>
              </div>
              <div className="space-y-3">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary/50"
                  >
                    <p className="font-medium leading-snug">{t.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t.subject}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(t.due).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <Badge tone={t.priority === "hoog" ? "warning" : "muted"}>
                        {t.estimate}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
