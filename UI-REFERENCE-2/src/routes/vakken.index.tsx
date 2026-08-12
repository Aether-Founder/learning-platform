import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, Meter, PageHeader } from "@/components/AppShell";
import { SUBJECTS, countSets } from "@/lib/aether-data";

export const Route = createFileRoute("/vakken/")({
  head: () => ({
    meta: [
      { title: "Vakken & mappen — Aether" },
      {
        name: "description",
        content:
          "Blader door je vakken, hoofdstukmappen en studiesets. Elke map opent in een eigen overzicht met oefenmodi.",
      },
      { property: "og:title", content: "Vakken & mappen — Aether" },
      {
        property: "og:description",
        content: "Elk vak heeft een eigen map met hoofdstukken en studiesets.",
      },
    ],
  }),
  component: VakkenIndex,
});

function VakkenIndex() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Bibliotheek"
        title="Vakken"
        description="Elk vak is een map. Open een vak om de hoofdstukken te zien en klik door naar een studieset."
      />

      <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((s) => (
          <Link
            key={s.slug}
            to="/vakken/$"
            params={{ _splat: s.slug }}
            className="bg-background p-6 transition-colors hover:bg-secondary/50"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{s.level}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">{s.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.children.length} mappen · {countSets(s.children)} sets · {s.teacher}
            </p>
            <div className="mt-5">
              <div className="mb-1.5 flex items-baseline justify-between text-xs text-muted-foreground">
                <span>
                  {s.topicsDone} van {s.topics} onderwerpen
                </span>
                <span className="tabular-nums">{s.mastery}%</span>
              </div>
              <Meter value={s.mastery} />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {s.due === 0 ? "Alles bij" : `${s.due} kaarten te herhalen`}
            </p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
