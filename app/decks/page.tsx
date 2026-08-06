"use client";

import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, PrimaryButton } from "@/components/ui-kit";

export default function DecksPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Herhaling"
        title="Decks & review"
        description="Oefen met spaced repetition. Kaarten komen terug op het juiste moment om je geheugen te versterken."
        action={<PrimaryButton>Nieuwe deck</PrimaryButton>}
      />

      <div className="mt-10">
        <EmptyState
          title="Nog geen decks"
          description="Maak je eerste deck om te beginnen met herhalen volgens de spaced repetition-methode."
          action={<PrimaryButton>Eerste deck maken</PrimaryButton>}
        />
      </div>
    </AppShell>
  );
}
