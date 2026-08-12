import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell, PageHeader } from "@/components/AppShell";
import {
  AGENDA_TONES,
  EVENT_LABELS,
  SCHOOL_EVENTS,
  type EventType,
  type SchoolEvent,
} from "@/lib/aether-data";

export const Route = createFileRoute("/kalender")({
  head: () => ({
    meta: [
      { title: "Schoolkalender — Aether" },
      {
        name: "description",
        content:
          "De volledige schoolkalender: toetsen, examens, deadlines, activiteiten en vakanties in één maandoverzicht.",
      },
      { property: "og:title", content: "Schoolkalender — Aether" },
      {
        property: "og:description",
        content: "Toetsen, examens, deadlines en vakanties in één rustig maandoverzicht.",
      },
    ],
  }),
  component: KalenderPage,
});

const TYPES: EventType[] = ["toets", "examen", "deadline", "les", "activiteit", "vakantie"];
const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function eventsOn(date: string, events: SchoolEvent[]) {
  return events.filter((e) =>
    e.end ? date >= e.date && date <= e.end : e.date === date,
  );
}

function KalenderPage() {
  const [cursor, setCursor] = useState(() => new Date(2026, 7, 1));
  const [active, setActive] = useState<EventType[]>([]);
  const [selected, setSelected] = useState<string | null>("2026-08-03");

  const events = useMemo(
    () => (active.length ? SCHOOL_EVENTS.filter((e) => active.includes(e.type)) : SCHOOL_EVENTS),
    [active],
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const monthLabel = cursor.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
  const selectedEvents = selected ? eventsOn(selected, events) : [];
  const upcoming = events
    .filter((e) => e.date >= "2026-08-01")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const toggle = (t: EventType) =>
    setActive((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Planning"
        title="Schoolkalender"
        description="Alle toetsen, examens, deadlines, activiteiten en vakanties van het schooljaar, gekoppeld aan je vakken."
      />

      <div className="flex flex-wrap items-center gap-2 py-6">
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

      <div className="grid gap-12 lg:grid-cols-[1fr_300px] lg:gap-14">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-3">
            <h2 className="font-display text-2xl font-semibold capitalize">{monthLabel}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCursor(new Date(year, month - 1, 1))}
                className="h-8 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
              >
                Vorige
              </button>
              <button
                type="button"
                onClick={() => setCursor(new Date(year, month + 1, 1))}
                className="h-8 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
              >
                Volgende
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px border-b border-border pb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {DAYS.map((d) => (
              <span key={d} className="px-2">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-lg bg-border">
            {cells.map((d, i) => {
              if (!d) return <div key={`e${i}`} className="min-h-[92px] bg-background" />;
              const key = iso(d);
              const dayEvents = eventsOn(key, events);
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={
                    "min-h-[92px] p-2 text-left align-top transition-colors " +
                    (isSelected ? "bg-secondary" : "bg-background hover:bg-secondary/50")
                  }
                >
                  <span className="text-xs tabular-nums text-muted-foreground">{d.getDate()}</span>
                  <span className="mt-1.5 block space-y-1">
                    {dayEvents.slice(0, 2).map((e) => (
                      <span
                        key={e.title}
                        className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${AGENDA_TONES[e.type]}`}
                      >
                        {e.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="block text-[10px] text-muted-foreground">
                        +{dayEvents.length - 2} meer
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3">
              <h2 className="font-display text-2xl font-semibold">
                {selected
                  ? new Date(selected).toLocaleDateString("nl-NL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  : "Geen dag geselecteerd"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {selectedEvents.length} {selectedEvents.length === 1 ? "item" : "items"}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {selectedEvents.map((e) => (
                <li key={e.title} className="flex flex-wrap items-center gap-4 py-5">
                  <span className="w-14 text-xs tabular-nums text-muted-foreground">
                    {e.time ?? "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{e.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[e.subject, e.location].filter(Boolean).join(" · ") || "Schoolbreed"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${AGENDA_TONES[e.type]}`}
                  >
                    {EVENT_LABELS[e.type]}
                  </span>
                </li>
              ))}
              {selectedEvents.length === 0 && (
                <li className="py-8 text-sm text-muted-foreground">Geen activiteiten op deze dag.</li>
              )}
            </ul>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-4 border-b border-border pb-3 font-display text-lg font-semibold">
            Komende weken
          </h2>
          <ul className="space-y-4">
            {upcoming.map((e) => (
              <li key={e.title} className="flex flex-col gap-1">
                <span className="text-[13px] font-medium leading-snug">{e.title}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.date).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                  {e.time ? ` · ${e.time}` : ""} · {EVENT_LABELS[e.type]}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
