import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell, Meter, SectionTitle } from "@/components/AppShell";
import { LESSONS, SCHOOL_EVENTS, SUBJECTS, countSets } from "@/lib/aether-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aether — Studeer slimmer, onthoud langer" },
      {
        name: "description",
        content:
          "Aether is het studieplatform voor VWO en HAVO: studiesets, lessen, kalender en oefenvoortgang per vak op één plek.",
      },
      { property: "og:title", content: "Aether — Studeer slimmer, onthoud langer" },
      {
        property: "og:description",
        content:
          "Studiesets, lessen en oefenvoortgang per vak — rustig, gefocust en overzichtelijk in één werkruimte.",
      },
    ],
  }),
  component: Index,
});

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-3xl font-semibold leading-none">{value}</span>
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors " +
        (active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

function Index() {
  const [subject, setSubject] = useState("Alle vakken");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => (subject === "Alle vakken" ? SUBJECTS : SUBJECTS.filter((s) => s.name === subject)),
    [subject],
  );

  const matches = (subjectName: string, text: string) =>
    (subject === "Alle vakken" || subjectName === subject) &&
    (query.trim() === "" ||
      `${text} ${subjectName}`.toLowerCase().includes(query.trim().toLowerCase()));

  const totalSets = SUBJECTS.reduce((a, s) => a + countSets(s.children), 0);
  const totalDue = SUBJECTS.reduce((a, s) => a + s.due, 0);
  const upcoming = SCHOOL_EVENTS.slice(0, 3);

  return (
    <AppShell search={query} onSearch={setQuery}>
      <section className="grid gap-8 border-b border-border py-12 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            VWO 4 · Natuur &amp; Techniek · 6 vakken
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05]">
            Welkom terug, Mohammed
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Je hebt {totalDue} kaarten klaarstaan om te herhalen. Begin bij Natuurkunde — daar loopt je
            beheersing het meest achter.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/vakken/$"
              params={{ _splat: "natuurkunde/mechanica/arbeid-energie" }}
              className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start oefensessie
            </Link>
            <Link
              to="/vakken"
              className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Bekijk vakken
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-6 md:border-l md:border-border md:pl-8">
          <Stat value={String(totalSets)} label="Sets" />
          <Stat value={String(SUBJECTS.length)} label="Vakken" />
          <Stat value={String(totalDue)} label="Te herhalen" />
        </dl>
      </section>

      <div className="flex flex-wrap items-center gap-2 py-6">
        <span className="mr-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Vak</span>
        <Chip active={subject === "Alle vakken"} onClick={() => setSubject("Alle vakken")}>
          Alle vakken
        </Chip>
        {SUBJECTS.map((s) => (
          <Chip key={s.name} active={subject === s.name} onClick={() => setSubject(s.name)}>
            {s.name}
          </Chip>
        ))}
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_300px] lg:gap-14">
        <div className="min-w-0">
          <SectionTitle
            action={
              <span className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "vak" : "vakken"}
              </span>
            }
          >
            Voortgang per vak
          </SectionTitle>
          <ul className="divide-y divide-border">
            {filtered.map((s) => (
              <li
                key={s.name}
                className="grid grid-cols-[1fr_auto] items-center gap-4 py-5 sm:grid-cols-[1.2fr_1fr_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">{s.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.level} · {countSets(s.children)} sets
                  </p>
                </div>
                <div className="hidden sm:block">
                  <div className="mb-1.5 flex items-baseline justify-between text-xs text-muted-foreground">
                    <span>
                      {s.topicsDone} van {s.topics} onderwerpen
                    </span>
                    <span className="tabular-nums">{s.mastery}%</span>
                  </div>
                  <Meter value={s.mastery} />
                </div>
                <div className="flex items-center justify-end gap-3">
                  {s.due === 0 ? (
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold tint-success">
                      Bij
                    </span>
                  ) : (
                    <span className="text-xs tabular-nums text-muted-foreground">{s.due} te doen</span>
                  )}
                  <Link
                    to="/vakken/$"
                    params={{ _splat: s.slug }}
                    className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
                  >
                    Openen
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12">
            <SectionTitle
              action={
                <Link
                  to="/lessen"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Alle lessen
                </Link>
              }
            >
              Aanbevolen lessen
            </SectionTitle>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              {LESSONS.filter((l) => matches(l.subject, l.title))
                .slice(0, 4)
                .map((l) => (
                  <article key={l.title} className="bg-background p-5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {l.subject}
                    </p>
                    <h3 className="mt-2 text-[15px] font-semibold leading-snug">{l.title}</h3>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {l.minutes} min · {l.level}
                    </p>
                  </article>
                ))}
            </div>
          </div>
        </div>

        <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          <div>
            <div className="mb-4 flex items-end justify-between border-b border-border pb-3">
              <h2 className="font-display text-lg font-semibold">Deze week</h2>
              <Link
                to="/kalender"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Kalender
              </Link>
            </div>
            <ul className="space-y-4">
              {upcoming.map((a) => (
                <li key={a.title} className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium leading-snug">{a.title}</span>
                  <span
                    className={
                      "text-xs " +
                      (a.type === "toets" || a.type === "examen"
                        ? "text-warning"
                        : "text-muted-foreground")
                    }
                  >
                    {new Date(a.date).toLocaleDateString("nl-NL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                    {a.time ? ` · ${a.time}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 border-b border-border pb-3 font-display text-lg font-semibold">
              Studieritme
            </h2>
            <div className="flex items-end gap-1.5">
              {[30, 55, 20, 70, 45, 85, 15].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="flex w-full items-end rounded-sm bg-secondary"
                    style={{ height: 64 }}
                    aria-hidden="true"
                  >
                    <div className="w-full rounded-sm bg-foreground/60" style={{ height: `${h}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {["m", "d", "w", "d", "v", "z", "z"][i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Gemiddeld 24 minuten per dag. Je beste dag was zaterdag.
            </p>
          </div>

          <div className="rounded-lg border border-border p-5">
            <h2 className="font-display text-lg font-semibold">Maak iets nieuws</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Zet aantekeningen om in een studieset en oefen er direct mee.
            </p>
            <button
              type="button"
              className="mt-4 h-9 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Nieuwe studieset
            </button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
