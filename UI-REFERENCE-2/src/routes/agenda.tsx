import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell, PageHeader } from "@/components/AppShell";
import {
  Badge,
  Field,
  GhostButton,
  Modal,
  Panel,
  PrimaryButton,
  Tabs,
  Toolbar,
  inputClass,
} from "@/components/ui-kit";
import {
  AGENDA_TONES,
  EVENT_LABELS,
  SCHOOL_EVENTS,
  type EventType,
  type SchoolEvent,
} from "@/lib/aether-data";
import { REMINDERS, TASKS, TIMETABLE } from "@/lib/os-data";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Aether" },
      {
        name: "description",
        content:
          "Volledige agenda met dag-, week-, maand-, jaar- en lijstweergave: lessen, toetsen, examens, deadlines, taken en herinneringen.",
      },
      { property: "og:title", content: "Agenda — Aether" },
      {
        property: "og:description",
        content: "Dag, week, maand, jaar en lijst — met toetsen, deadlines, taken en herinneringen.",
      },
    ],
  }),
  component: AgendaPage,
});

const VIEWS = [
  { value: "dag", label: "Dag" },
  { value: "week", label: "Week" },
  { value: "maand", label: "Maand" },
  { value: "jaar", label: "Jaar" },
  { value: "lijst", label: "Lijst" },
] as const;
type View = (typeof VIEWS)[number]["value"];

const TYPES: EventType[] = ["toets", "examen", "deadline", "les", "activiteit", "vakantie"];
const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];
const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i);

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function eventsOn(date: string, events: SchoolEvent[]) {
  return events.filter((e) => (e.end ? date >= e.date && date <= e.end : e.date === date));
}

function startOfWeek(d: Date) {
  const c = new Date(d);
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
  return c;
}

function longDate(date: string) {
  return new Date(date).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function AgendaPage() {
  const [view, setView] = useState<View>("maand");
  const [cursor, setCursor] = useState(() => new Date(2026, 7, 3));
  const [active, setActive] = useState<EventType[]>([]);
  const [selected, setSelected] = useState<string>("2026-08-03");
  const [creating, setCreating] = useState(false);

  const events = useMemo(
    () => (active.length ? SCHOOL_EVENTS.filter((e) => active.includes(e.type)) : SCHOOL_EVENTS),
    [active],
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = `${MONTHS[month]} ${year}`;
  const selectedEvents = eventsOn(selected, events);

  const toggle = (t: EventType) =>
    setActive((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));

  const step = (dir: number) => {
    const c = new Date(cursor);
    if (view === "dag") c.setDate(c.getDate() + dir);
    else if (view === "week") c.setDate(c.getDate() + dir * 7);
    else if (view === "jaar") c.setFullYear(c.getFullYear() + dir);
    else c.setMonth(c.getMonth() + dir);
    setCursor(c);
    if (view === "dag") setSelected(iso(c));
  };

  const weekStart = startOfWeek(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const upcomingTasks = TASKS.filter((t) => t.status !== "klaar").slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Planning"
        title="Agenda"
        description="Rooster, toetsen, examens, deadlines, activiteiten, taken en herinneringen in één samenhangend overzicht."
        action={<PrimaryButton onClick={() => setCreating(true)}>Nieuwe afspraak</PrimaryButton>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-6">
        <Toolbar>
          <GhostButton onClick={() => step(-1)}>Vorige</GhostButton>
          <GhostButton onClick={() => setCursor(new Date(2026, 7, 3))}>Vandaag</GhostButton>
          <GhostButton onClick={() => step(1)}>Volgende</GhostButton>
          <span className="ml-2 font-display text-2xl font-semibold capitalize">
            {view === "jaar" ? year : monthLabel}
          </span>
        </Toolbar>
        <Tabs tabs={VIEWS} value={view} onChange={setView} />
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
          {view === "maand" && (
            <MonthGrid
              year={year}
              month={month}
              events={events}
              selected={selected}
              onSelect={setSelected}
            />
          )}
          {view === "week" && <WeekGrid days={weekDays} events={events} onSelect={setSelected} />}
          {view === "dag" && <DayView date={selected} events={events} />}
          {view === "jaar" && <YearView year={year} events={events} onSelect={setSelected} />}
          {view === "lijst" && <ScheduleView events={events} />}

          <div className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3">
              <h2 className="font-display text-2xl font-semibold">{longDate(selected)}</h2>
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
                <li className="py-8 text-sm text-muted-foreground">
                  Geen afspraken op deze dag. Een vrije dag is ook studietijd.
                </li>
              )}
            </ul>
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

          <div>
            <h2 className="mb-4 border-b border-border pb-3 font-display text-lg font-semibold">
              Taken & deadlines
            </h2>
            <ul className="space-y-3">
              {upcomingTasks.map((t) => (
                <li key={t.id} className="flex items-start gap-2.5">
                  <span
                    className="mt-1 h-3.5 w-3.5 shrink-0 rounded-[4px] border border-border"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-snug">{t.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t.subject} ·{" "}
                      {new Date(t.due).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </p>
                  </div>
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

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nieuwe afspraak"
        description="Voorbeeldformulier — er wordt niets opgeslagen."
        footer={
          <>
            <GhostButton onClick={() => setCreating(false)}>Annuleren</GhostButton>
            <PrimaryButton onClick={() => setCreating(false)}>Opslaan</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Titel">
            <input className={inputClass} placeholder="Bijv. PW hoofdstuk 4" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Datum">
              <input className={inputClass} defaultValue="2026-08-03" />
            </Field>
            <Field label="Tijd">
              <input className={inputClass} defaultValue="09:00" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select className={inputClass}>
                {TYPES.map((t) => (
                  <option key={t}>{EVENT_LABELS[t]}</option>
                ))}
              </select>
            </Field>
            <Field label="Herhaling">
              <select className={inputClass}>
                <option>Niet herhalen</option>
                <option>Elke dag</option>
                <option>Elke week</option>
                <option>Elke 2 weken</option>
                <option>Elke maand</option>
              </select>
            </Field>
          </div>
          <Field label="Locatie" hint="Lokaal, sportzaal of thuis">
            <input className={inputClass} placeholder="Lokaal 2.14" />
          </Field>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge tone="outline">Herinnering 30 min</Badge>
            <Badge tone="outline">Herinnering 1 dag</Badge>
            <Badge tone="outline">Taak koppelen</Badge>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

function MonthGrid({
  year,
  month,
  events,
  selected,
  onSelect,
}: {
  year: number;
  month: number;
  events: SchoolEvent[];
  selected: string;
  onSelect: (d: string) => void;
}) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  return (
    <>
      <div className="grid grid-cols-7 gap-px border-b border-border pb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {DAYS.map((d) => (
          <span key={d} className="px-2">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-lg bg-border">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} className="min-h-[96px] bg-background" />;
          const key = iso(d);
          const dayEvents = eventsOn(key, events);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={
                "min-h-[96px] p-2 text-left align-top transition-colors " +
                (selected === key ? "bg-secondary" : "bg-background hover:bg-secondary/50")
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
    </>
  );
}

function WeekGrid({
  days,
  events,
  onSelect,
}: {
  days: Date[];
  events: SchoolEvent[];
  onSelect: (d: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border">
          <span />
          {days.map((d) => (
            <button
              key={iso(d)}
              type="button"
              onClick={() => onSelect(iso(d))}
              className="border-l border-border px-2 py-2.5 text-left transition-colors hover:bg-secondary/50"
            >
              <span className="block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {DAYS[(d.getDay() + 6) % 7]}
              </span>
              <span className="font-display text-lg font-semibold">{d.getDate()}</span>
            </button>
          ))}
        </div>
        {HOURS.map((h) => (
          <div key={h} className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border">
            <span className="py-3 pr-2 text-right text-[11px] tabular-nums text-muted-foreground">
              {String(h).padStart(2, "0")}:00
            </span>
            {days.map((d) => {
              const key = iso(d);
              const slot = eventsOn(key, events).filter(
                (e) => e.time && Number(e.time.slice(0, 2)) === h,
              );
              return (
                <div key={key + h} className="min-h-[46px] border-l border-border p-1">
                  {slot.map((e) => (
                    <span
                      key={e.title}
                      className={`mb-1 block truncate rounded px-1.5 py-1 text-[10px] font-semibold ${AGENDA_TONES[e.type]}`}
                    >
                      {e.time} {e.title}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayView({ date, events }: { date: string; events: SchoolEvent[] }) {
  const list = eventsOn(date, events);
  return (
    <div className="rounded-lg border border-border">
      {HOURS.map((h) => {
        const slot = list.filter((e) => e.time && Number(e.time.slice(0, 2)) === h);
        const lesson = TIMETABLE.find((l) => Number(l.time.slice(0, 2)) === h);
        return (
          <div key={h} className="grid grid-cols-[72px_1fr] border-b border-border last:border-b-0">
            <span className="py-4 pr-3 text-right text-[11px] tabular-nums text-muted-foreground">
              {String(h).padStart(2, "0")}:00
            </span>
            <div className="space-y-1.5 border-l border-border p-2">
              {lesson && (
                <span className="block rounded bg-secondary px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
                  {lesson.subject} · {lesson.room} · {lesson.teacher}
                </span>
              )}
              {slot.map((e) => (
                <span
                  key={e.title}
                  className={`block rounded px-2 py-1.5 text-[11px] font-semibold ${AGENDA_TONES[e.type]}`}
                >
                  {e.time} · {e.title}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function YearView({
  year,
  events,
  onSelect,
}: {
  year: number;
  events: SchoolEvent[];
  onSelect: (d: string) => void;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {MONTHS.map((m, mi) => {
        const first = new Date(year, mi, 1);
        const offset = (first.getDay() + 6) % 7;
        const total = new Date(year, mi + 1, 0).getDate();
        return (
          <div key={m} className="rounded-lg border border-border p-4">
            <p className="mb-2 font-display text-lg font-semibold capitalize">{m}</p>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
              {DAYS.map((d) => (
                <span key={d}>{d[0]}</span>
              ))}
              {Array.from({ length: offset }, (_, i) => (
                <span key={`o${i}`} />
              ))}
              {Array.from({ length: total }, (_, i) => {
                const d = new Date(year, mi, i + 1);
                const key = iso(d);
                const has = eventsOn(key, events).length > 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelect(key)}
                    className={
                      "rounded-[3px] py-0.5 tabular-nums transition-colors hover:bg-secondary " +
                      (has ? "bg-secondary font-semibold text-foreground" : "")
                    }
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScheduleView({ events }: { events: SchoolEvent[] }) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const groups = sorted.reduce<Record<string, SchoolEvent[]>>((acc, e) => {
    (acc[e.date] ||= []).push(e);
    return acc;
  }, {});
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {Object.entries(groups).map(([date, list]) => (
        <div key={date} className="grid gap-3 p-5 sm:grid-cols-[160px_1fr]">
          <p className="text-xs capitalize text-muted-foreground">{longDate(date)}</p>
          <ul className="space-y-2.5">
            {list.map((e) => (
              <li key={e.title} className="flex flex-wrap items-center gap-3">
                <span className="w-12 text-xs tabular-nums text-muted-foreground">
                  {e.time ?? "hele dag"}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{e.title}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${AGENDA_TONES[e.type]}`}
                >
                  {EVENT_LABELS[e.type]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
