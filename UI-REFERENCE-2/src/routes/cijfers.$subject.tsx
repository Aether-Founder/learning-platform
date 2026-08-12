import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import {
  Badge,
  BarChart,
  Field,
  GhostButton,
  KeyValue,
  Panel,
  PrimaryButton,
  fmt,
  gradeTone,
  inputClass,
} from "@/components/ui-kit";
import { GRADEBOOK, averageOf } from "@/lib/os-data";

export const Route = createFileRoute("/cijfers/$subject")({
  head: () => ({
    meta: [
      { title: "Cijfers per vak — Aether" },
      {
        name: "description",
        content:
          "Alle toetsen van één vak met weging, datum en periode, plus de rekenhulp voor het cijfer dat je nog nodig hebt.",
      },
      { property: "og:title", content: "Cijfers per vak — Aether" },
      {
        property: "og:description",
        content: "Toetsen, wegingen en de streefcijfer-rekenhulp per vak.",
      },
    ],
  }),
  component: SubjectGradesPage,
});

function SubjectGradesPage() {
  const { subject: slug } = Route.useParams();
  const subject = GRADEBOOK.find((s) => s.slug === slug);

  const [target, setTarget] = useState(subject ? String(subject.target) : "7");
  const [weight, setWeight] = useState("3");
  const [showAll, setShowAll] = useState(true);

  const scored = useMemo(
    () => (subject ? subject.grades.filter((g) => g.grade !== null) : []),
    [subject],
  );

  if (!subject) {
    throw notFound();
  }

  const avg = averageOf(subject.grades);
  const currentWeight = scored.reduce((a, g) => a + g.weight, 0);
  const currentPoints = scored.reduce((a, g) => a + (g.grade as number) * g.weight, 0);
  const t = Number(target.replace(",", ".")) || 0;
  const w = Number(weight.replace(",", ".")) || 1;
  const needed = (t * (currentWeight + w) - currentPoints) / w;
  const reachable = needed <= 10 && needed >= 1;

  const visible = showAll ? subject.grades : scored;

  return (
    <AppShell>
      <nav className="flex flex-wrap items-center gap-1.5 pt-8 text-xs text-muted-foreground">
        <Link to="/cijfers" className="underline-offset-4 hover:text-foreground hover:underline">
          Cijfers
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">{subject.name}</span>
      </nav>

      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-8">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {subject.teacher}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1]">{subject.name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {scored.length} van {subject.grades.length} toetsen beoordeeld · totale weging{" "}
            {currentWeight}
          </p>
        </div>
        <div className="flex items-end gap-8">
          <div className="text-right">
            <p className="font-display text-5xl font-semibold leading-none tabular-nums">
              {fmt(avg)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Gemiddeld
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-semibold leading-none tabular-nums text-muted-foreground">
              {fmt(subject.target)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Streefcijfer
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-10 pt-10 lg:grid-cols-[1fr_320px] lg:gap-14">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold">Toetsen</h2>
            <div className="flex gap-2">
              <GhostButton active={showAll} onClick={() => setShowAll(true)}>
                Alles
              </GhostButton>
              <GhostButton active={!showAll} onClick={() => setShowAll(false)}>
                Alleen beoordeeld
              </GhostButton>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Toets</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Datum</th>
                  <th className="px-5 py-3 text-center font-medium">Periode</th>
                  <th className="px-5 py-3 text-center font-medium">Weging</th>
                  <th className="px-5 py-3 text-right font-medium">Cijfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((g) => (
                  <tr key={g.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-5 py-4 font-medium">{g.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{g.type}</td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">
                      {new Date(g.date).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-center tabular-nums text-muted-foreground">
                      {g.period}
                    </td>
                    <td className="px-5 py-4 text-center tabular-nums text-muted-foreground">
                      ×{g.weight}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {g.grade === null ? (
                        <span className="text-xs text-muted-foreground">nog niet</span>
                      ) : (
                        <Badge tone={gradeTone(g.grade)}>{fmt(g.grade)}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Panel title="Cijferverloop">
              <BarChart
                values={scored.map((g) => g.grade as number)}
                labels={scored.map((g) => g.type)}
              />
            </Panel>
            <Panel title="Samenvatting">
              <KeyValue
                items={[
                  ["Gemiddelde", <span className="tabular-nums">{fmt(avg)}</span>],
                  ["Hoogste", <span className="tabular-nums">{fmt(Math.max(...scored.map((g) => g.grade as number)))}</span>],
                  ["Laagste", <span className="tabular-nums">{fmt(Math.min(...scored.map((g) => g.grade as number)))}</span>],
                  ["Onvoldoendes", scored.filter((g) => (g.grade as number) < 5.5).length],
                  ["Openstaand", subject.grades.length - scored.length],
                ]}
              />
            </Panel>
          </div>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <Panel title="Wat heb ik nodig?">
            <div className="space-y-4">
              <Field label="Streefcijfer" hint="Het gemiddelde dat je wilt halen">
                <input
                  className={inputClass}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  inputMode="decimal"
                />
              </Field>
              <Field label="Weging volgende toets">
                <input
                  className={inputClass}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  inputMode="decimal"
                />
              </Field>

              <div className="rounded-md border border-border p-4 text-center">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Benodigd cijfer
                </p>
                <p className="mt-2 font-display text-5xl font-semibold leading-none tabular-nums">
                  {needed <= 0 ? "1,0" : fmt(Math.min(needed, 10))}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {needed <= 0
                    ? "Je streefcijfer is al veiliggesteld met de huidige resultaten."
                    : reachable
                      ? `Haal minstens ${fmt(needed)} op de volgende toets (weging ×${w}) om op ${fmt(t)} uit te komen.`
                      : `Met weging ×${w} is ${fmt(t)} niet haalbaar in één toets. Verhoog de weging of spreid het over meerdere toetsen.`}
                </p>
              </div>

              <PrimaryButton className="w-full">Bereken opnieuw</PrimaryButton>
              <p className="text-center text-[11px] text-muted-foreground">
                Berekening werkt live mee met je invoer.
              </p>
            </div>
          </Panel>

          <Panel title="Scenario's">
            <ul className="divide-y divide-border text-sm">
              {[5.5, 6.5, 7.5, 8.5].map((s) => {
                const req = (s * (currentWeight + w) - currentPoints) / w;
                return (
                  <li key={s} className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground">Gemiddeld {fmt(s)}</span>
                    <span className="tabular-nums font-medium">
                      {req <= 0 ? "gehaald" : req > 10 ? "niet haalbaar" : fmt(req)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Andere vakken">
            <ul className="space-y-2.5">
              {GRADEBOOK.filter((s) => s.slug !== subject.slug).map((s) => (
                <li key={s.slug}>
                  <Link
                    to="/cijfers/$subject"
                    params={{ subject: s.slug }}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-secondary"
                  >
                    <span>{s.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {fmt(averageOf(s.grades))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
