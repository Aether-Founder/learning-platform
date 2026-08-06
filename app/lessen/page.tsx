"use client";

import { useState } from "react";
import { AppShell, PageHeader, SearchField } from "@/components/AppShell";
import { LESSONS } from "@/lib/aether-data";

export default function LessenPage() {
  const [q, setQ] = useState("");
  const list = LESSONS.filter((l) =>
    `${l.title} ${l.subject}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Verdieping"
        title="Lessen"
        description="Compacte uitleg per onderwerp. Volg een les en oefen daarna direct met de bijbehorende studieset."
        action={<SearchField value={q} onChange={setQ} placeholder="Zoek een les" className="w-64" />}
      />

      <ul className="divide-y divide-border">
        {list.map((l) => (
          <li key={l.title} className="flex flex-wrap items-center gap-4 py-5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {l.subject}
              </p>
              <p className="mt-1 truncate text-[15px] font-semibold">{l.title}</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {l.minutes} min · {l.level}
            </span>
            <button
              type="button"
              className="h-8 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
            >
              Starten
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="py-10 text-sm text-muted-foreground">Geen lessen gevonden.</li>
        )}
      </ul>
    </AppShell>
  );
}
