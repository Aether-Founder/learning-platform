import { createFileRoute } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";
import { GROUPS } from "@/lib/aether-data";

export const Route = createFileRoute("/groepen")({
  head: () => ({
    meta: [
      { title: "Groepen — Aether" },
      {
        name: "description",
        content:
          "Studeer samen: klassen en studiegroepen delen sets, plannen toetsmomenten en houden voortgang bij.",
      },
      { property: "og:title", content: "Groepen — Aether" },
      {
        property: "og:description",
        content: "Klassen en studiegroepen delen studiesets en toetsmomenten.",
      },
    ],
  }),
  component: GroepenPage,
});

function GroepenPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Samen leren"
        title="Groepen"
        description="Gedeelde sets, gezamenlijke voorbereiding en overzicht van wat je klasgenoten oefenen."
        action={
          <button
            type="button"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Groep aanmaken
          </button>
        }
      />

      <ul className="divide-y divide-border">
        {GROUPS.map((g) => (
          <li key={g.name} className="flex flex-wrap items-center gap-4 py-5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{g.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {g.members} leden · {g.activity}
              </p>
            </div>
            <button
              type="button"
              className="h-8 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
            >
              Bekijken
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
