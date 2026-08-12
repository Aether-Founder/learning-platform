import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import {
  Badge,
  ContextMenu,
  EmptyState,
  GhostButton,
  Panel,
  PrimaryButton,
  Tabs,
} from "@/components/ui-kit";
import { NOTE_TREE, SLASH_COMMANDS, TASKS, type NotePage } from "@/lib/os-data";

export const Route = createFileRoute("/notities")({
  head: () => ({
    meta: [
      { title: "Notities & wiki — Aether" },
      {
        name: "description",
        content:
          "Geneste pagina's, databases en sjablonen: schrijf samenvattingen, bekijk ze als tabel, bord, galerij of tijdlijn.",
      },
      { property: "og:title", content: "Notities & wiki — Aether" },
      {
        property: "og:description",
        content: "Geneste pagina's, databaseweergaven en sjablonen voor je samenvattingen.",
      },
    ],
  }),
  component: NotitiesPage,
});

const DB_VIEWS = [
  { value: "tabel", label: "Tabel" },
  { value: "bord", label: "Bord" },
  { value: "galerij", label: "Galerij" },
  { value: "tijdlijn", label: "Tijdlijn" },
] as const;
type DbView = (typeof DB_VIEWS)[number]["value"];

function flatten(pages: NotePage[], depth = 0): { page: NotePage; depth: number }[] {
  return pages.flatMap((p) => [{ page: p, depth }, ...flatten(p.children ?? [], depth + 1)]);
}

const FLAT = flatten(NOTE_TREE);

function NotitiesPage() {
  const [current, setCurrent] = useState("differentieren");
  const [dbView, setDbView] = useState<DbView>("tabel");
  const [slashOpen, setSlashOpen] = useState(false);

  const entry = FLAT.find((f) => f.page.slug === current) ?? FLAT[0]!;
  const page = entry.page;

  return (
    <AppShell>
      <div className="grid gap-10 pt-8 lg:grid-cols-[240px_1fr] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Werkruimte
            </span>
            <GhostButton>+</GhostButton>
          </div>
          <ContextMenu
            items={["Nieuwe subpagina", "Hernoemen", "Dupliceren", "Naar sjabloon", "Verplaatsen", "Verwijderen"]}
          >
            <ul className="space-y-0.5">
              {FLAT.map(({ page: p, depth }) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    onClick={() => setCurrent(p.slug)}
                    style={{ paddingLeft: 8 + depth * 14 }}
                    className={
                      "flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-[13px] transition-colors " +
                      (current === p.slug
                        ? "bg-secondary font-medium text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground")
                    }
                  >
                    <span aria-hidden="true" className="text-xs">
                      {p.icon}
                    </span>
                    <span className="truncate">{p.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </ContextMenu>

          <div className="mt-8">
            <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Sjablonen
            </p>
            <ul className="space-y-1 text-[13px] text-muted-foreground">
              {["Samenvatting", "Toetsplan", "Boekverslag", "Practicumverslag"].map((t) => (
                <li key={t} className="rounded-md px-2 py-1.5 transition-colors hover:bg-secondary">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="min-w-0">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>Werkruimte</span>
            <span aria-hidden="true">/</span>
            <span>Schooljaar 2026/2027</span>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">{page.title}</span>
          </nav>

          <header className="border-b border-border py-8">
            <p className="text-4xl" aria-hidden="true">
              {page.icon}
            </p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05]">{page.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {page.tags.map((t) => (
                <Badge key={t} tone="outline">
                  #{t}
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground">
                {page.words} woorden · bijgewerkt {page.updated}
              </span>
            </div>
          </header>

          <article className="space-y-4 py-8 text-sm leading-relaxed text-muted-foreground">
            <p className="text-[15px] text-foreground">
              {page.excerpt ?? "Een lege pagina wacht op je eerste alinea."}
            </p>
            <h2 className="pt-4 font-display text-2xl font-semibold text-foreground">Kernpunten</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Herhaal elke regel eerst met een eenvoudig voorbeeld voordat je combineert.</li>
              <li>Werk altijd van buiten naar binnen bij samengestelde functies.</li>
              <li>Controleer je antwoord door terug te rekenen naar de oorspronkelijke functie.</li>
            </ul>
            <blockquote className="border-l-2 border-border pl-4 italic">
              "Wie de regel begrijpt, hoeft hem niet te onthouden."
            </blockquote>
            <div className="rounded-md border border-border p-4 font-display text-xl text-foreground">
              f(g(x))′ = f′(g(x)) · g′(x)
            </div>
            <div className="space-y-2 pt-2">
              {["Uitwerkingen controleren", "Oefenset koppelen", "Samenvatting exporteren"].map((c, i) => (
                <label key={c} className="flex items-center gap-2.5 text-foreground">
                  <input type="checkbox" defaultChecked={i === 0} className="h-3.5 w-3.5" />
                  <span className={i === 0 ? "line-through text-muted-foreground" : ""}>{c}</span>
                </label>
              ))}
            </div>

            <div className="relative pt-4">
              <button
                type="button"
                onClick={() => setSlashOpen((o) => !o)}
                className="w-full rounded-md border border-dashed border-border px-4 py-3 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary/50"
              >
                Typ / voor commando's…
              </button>
              {slashOpen && (
                <div className="absolute z-20 mt-2 w-72 rounded-md border border-border bg-background p-1 shadow-xl">
                  {SLASH_COMMANDS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setSlashOpen(false)}
                      className="flex w-full items-center justify-between rounded-[6px] px-3 py-2 text-left transition-colors hover:bg-secondary"
                    >
                      <span className="text-xs font-medium text-foreground">{c.label}</span>
                      <span className="text-[11px] text-muted-foreground">{c.hint}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </article>

          <section className="pt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <h2 className="font-display text-2xl font-semibold">Database — opdrachten</h2>
              <div className="flex items-center gap-2">
                <Tabs tabs={DB_VIEWS} value={dbView} onChange={setDbView} size="sm" />
                <PrimaryButton>Nieuw</PrimaryButton>
              </div>
            </div>

            {dbView === "tabel" && (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Naam</th>
                      <th className="px-5 py-3 font-medium">Vak</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Deadline</th>
                      <th className="px-5 py-3 font-medium">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {TASKS.map((t) => (
                      <tr key={t.id} className="transition-colors hover:bg-secondary/40">
                        <td className="px-5 py-3.5 font-medium">{t.title}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{t.subject}</td>
                        <td className="px-5 py-3.5">
                          <Badge tone={t.status === "klaar" ? "success" : "muted"}>{t.status}</Badge>
                        </td>
                        <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{t.due}</td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          {t.tags.map((x) => `#${x}`).join(" ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {dbView === "bord" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(["todo", "bezig", "review", "klaar"] as const).map((col) => (
                  <div key={col} className="rounded-lg border border-border p-3">
                    <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {col}
                    </p>
                    <div className="space-y-2">
                      {TASKS.filter((t) => t.status === col).map((t) => (
                        <div key={t.id} className="rounded-md border border-border p-3">
                          <p className="text-[13px] font-medium leading-snug">{t.title}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{t.subject}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {dbView === "galerij" && (
              <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                {TASKS.map((t) => (
                  <div key={t.id} className="bg-background p-5">
                    <div className="mb-3 h-20 rounded-md bg-secondary" aria-hidden="true" />
                    <p className="text-[14px] font-semibold leading-snug">{t.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.subject} · {t.estimate}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {dbView === "tijdlijn" && (
              <div className="space-y-2 rounded-lg border border-border p-5">
                {TASKS.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-xs text-muted-foreground">
                      {t.title}
                    </span>
                    <div className="h-4 flex-1 rounded-sm bg-secondary">
                      <div
                        className="h-full rounded-sm bg-foreground/60"
                        style={{ marginLeft: `${i * 7}%`, width: `${18 + (i % 4) * 8}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="pt-12">
            <Panel title="Recent verwijderd">
              <EmptyState
                title="Prullenbak is leeg"
                description="Verwijderde pagina's blijven hier 30 dagen bewaard voordat ze definitief verdwijnen."
                action={<GhostButton>Prullenbak openen</GhostButton>}
              />
            </Panel>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
