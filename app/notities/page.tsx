"use client";

import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, PrimaryButton } from "@/components/ui-kit";

export default function NotitiesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Kennisbank"
        title="Notities"
        description="Samenvattingen, aantekeningen en studieplanningen in een flexibele werkruimte met blokken."
        action={
          <PrimaryButton>Nieuwe pagina</PrimaryButton>
        }
      />

      <div className="mt-10">
        <EmptyState
          title="Nog geen notities"
          description="Begin met het maken van je eerste notitie-pagina. Gebruik blokken voor tekst, lijsten, tabellen en meer."
          action={<PrimaryButton>Eerste pagina maken</PrimaryButton>}
        />
      </div>
    </AppShell>
  );
}
