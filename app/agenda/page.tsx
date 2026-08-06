"use client";

import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Badge, GhostButton, Panel, Toolbar } from "@/components/ui-kit";
import { SCHOOL_EVENTS, EVENT_LABELS, AGENDA_TONES, type EventType } from "@/lib/aether-data";
import { REMINDERS, TIMETABLE } from "@/lib/os-data";

const TYPES: EventType[] = ["toets", "examen", "deadline", "les", "activiteit", "vakantie"];

export default function AgendaPage() {
  const [active, setActive] = useState<EventType[]>([]);

  const events = active.length 
    ? SCHOOL_EVENTS.filter((e) => active.includes(e.type)) 
    : SCHOOL_EVENTS;

  const toggle = (t: EventType) =>
    setActive((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Planning"
        title="Agenda"
        description="Rooster, toetsen, examens, deadlines, activiteiten, taken en herinneringen in één samenhangend overzicht."
        action={
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Nieuwe afspraak
          </button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-6">
        <Toolbar>
          <GhostButton>Vorige</GhostButton>
          <GhostButton>Vandaag</GhostButton>
          <GhostButton>Volgende</GhostButton>
          <span className="ml-2 font-display text-2xl font-semibold">
            Augustus 2026
          </span>
        </Toolbar>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-6">
        <span className="mr-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Filter
        </span>
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            className={
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors " +
              (active.includes(t)
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground")
            }
          >
            {EVENT_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="grid gap-12 pt-8 lg:grid-cols-[1fr_300px] lg:gap-14">
        <div className="min-w-0">
          <div className="divide-y divide-border rounded-lg border border-border">
            {events.slice(0, 10).map((e) => (
              <div key={e.title} className="grid gap-3 p-5 sm:grid-cols-[160px_1fr]">
                <p className="text-xs capitalize text-muted-foreground">
                  {new Date(e.date).toLocaleDateString("nl-NL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-12 text-xs tabular-nums text-muted-foreground">
                    {e.time ?? "hele dag"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{e.title}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${AGENDA_TONES[e.type]}`}>
                    {EVENT_LABELS[e.type]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Panel title="Lesrooster vandaag">
              <ul className="divide-y divide-border">
                {TIMETABLE.map((l) => (
                  <li key={l.period} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="w-4 text-xs tabular-nums text-muted-foreground">{l.period}</span>
                    <span className="w-12 text-xs tabular-nums text-muted-foreground">{l.time}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{l.subject}</span>
                    <span className="text-xs text-muted-foreground">{l.room}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Herinneringen">
              <ul className="divide-y divide-border">
                {REMINDERS.map((r) => (
                  <li key={r.title} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium">{r.title}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{r.time}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {[r.subject, r.repeat].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          <div>
            <h2 className="mb-4 border-b border-border pb-3 font-display text-lg font-semibold">
              Komende toetsen
            </h2>
            <ul className="space-y-4">
              {SCHOOL_EVENTS.filter((e) => e.type === "toets" || e.type === "examen")
                .slice(0, 5)
                .map((e) => (
                  <li key={e.title} className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium leading-snug">{e.title}</span>
                    <span className="text-xs text-warning">
                      {new Date(e.date).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "long",
                      })}
                      {e.time ? ` · ${e.time}` : ""}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border p-5">
            <h2 className="font-display text-lg font-semibold">Agenda's</h2>
            <ul className="mt-3 space-y-2.5">
              {["Rooster", "Toetsen", "Persoonlijk", "Klas 4V-A", "Vakanties"].map((c, i) => (
                <li key={c} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className="h-3 w-3 rounded-[4px] bg-foreground"
                    style={{ opacity: 0.9 - i * 0.15 }}
                    aria-hidden="true"
                  />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
