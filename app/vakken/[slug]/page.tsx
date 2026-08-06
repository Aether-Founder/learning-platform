"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui-kit";
import { findSubject, countSets } from "@/lib/aether-data";

export default function SubjectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const subject = findSubject(slug);

  if (!subject) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Bibliotheek"
          title="Vak niet gevonden"
          description="Dit vak bestaat niet of is verwijderd."
        />
        <div className="mt-8">
          <Link
            href="/vakken"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Terug naar vakken
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={subject.level}
        title={subject.name}
        description={`${subject.children.length} hoofdstukmappen · ${countSets(subject.children)} studiesets · Docent: ${subject.teacher}`}
        action={
          <div className="flex flex-col gap-2">
            <Badge tone={subject.due === 0 ? "success" : "warning"}>
              {subject.due === 0 ? "Alles bij" : `${subject.due} te herhalen`}
            </Badge>
            <p className="text-xs text-muted-foreground text-right">
              {subject.mastery}% beheersing
            </p>
          </div>
        }
      />

      {subject.children.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold">Nog geen hoofdstukken</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Er zijn nog geen hoofdstukmappen toegevoegd aan dit vak.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {subject.children.map((folder) => (
            <div
              key={folder.slug}
              className="bg-background p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {folder.kind === "folder" ? "Map" : "Set"}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-semibold">{folder.name}</h3>
                  {folder.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{folder.description}</p>
                  )}
                  {folder.children && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {countSets(folder.children)} sets
                    </p>
                  )}
                  {folder.cards && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {folder.cards.length} kaarten
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/vakken"
          className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
        >
          Terug naar vakken
        </Link>
      </div>
    </AppShell>
  );
}
