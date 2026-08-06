"use client";

import { AppShell, PageHeader } from "@/components/AppShell";
import { PrimaryButton } from "@/components/ui-kit";
import { GROUPS } from "@/lib/aether-data";

export default function GroepenPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Samenwerken"
        title="Groepen"
        description="Deel sets, maak samen oefentoetsen en houd voortgang bij in je klas of studiegroep."
        action={<PrimaryButton>Groep maken</PrimaryButton>}
      />

      <div className="mt-10 divide-y divide-border rounded-lg border border-border">
        {GROUPS.map((g) => (
          <div
            key={g.name}
            className="flex flex-wrap items-center justify-between gap-4 p-6 transition-colors hover:bg-secondary/50"
          >
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl font-semibold">{g.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {g.members} leden · {g.activity}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Openen
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
