import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, PageHeader } from "@/components/AppShell";
import {
  Badge,
  BarChart,
  GhostButton,
  Heatmap,
  KeyValue,
  Panel,
  PrimaryButton,
  Tabs,
} from "@/components/ui-kit";
import { CARD_BROWSER, CARD_TAGS, DECKS, HEATMAP, REVIEW_FORECAST, type Deck } from "@/lib/os-data";

export const Route = createFileRoute("/decks")({
  head: () => ({
    meta: [
      { title: "Decks & review — Aether" },
      {
        name: "description",
        content:
          "Geneste decks, reviewwachtrij, kaartenbrowser, tags en statistieken voor gespreide herhaling.",
      },
      { property: "og:title", content: "Decks & review — Aether" },
      {
        property: "og:description",
        content: "Geneste decks, reviewwachtrij, kaartenbrowser en herhalingsstatistieken.",
      },
    ],
  }),
  component: DecksPage,
});

const VIEWS = [
  { value: "decks", label: "Decks" },
  { value: "review", label: "Review" },
  { value: "browser", label: "Browser" },
  { value: "stats", label: "Statistieken" },
] as const;
type View = (typeof VIEWS)[number]["value"];

function DeckRows({ decks, depth = 0 }: { decks: Deck[]; depth?: number }) {
  return (
    <>
      {decks.map((d) => (
        <tbody key={d.slug} className="divide-y divide-border">
          <tr className="transition-colors hover:bg-secondary/40">
            <td className="px-5 py-3.5 font-medium" style={{ paddingLeft: 20 + depth * 18 }}>
              {depth > 0 && <span className="mr-2 text-muted-foreground">↳</span>}
              {d.name}
            </td>
            <td className="px-5 py-3.5 text-center tabular-nums text-muted-foreground">{d.new}</td>
            <td className="px-5 py-3.5 text-center tabular-nums text-muted-foreground">{d.learn}</td>
            <td className="px-5 py-3.5 text-center tabular-nums">{d.due}</td>
            <td className="px-5 py-3.5 text-right">
              <GhostButton>Studeren</GhostButton>
            </td>
          </tr>
          {d.children && (
            <tr>
              <td colSpan={5} className="p-0">
                <table className="w-full">
                  <DeckRows decks={d.children} depth={depth + 1} />
                </table>
              </td>
            </tr>
          )}
        </tbody>
      ))}
    </>
  );
}

function DecksPage() {
  const [view, setView] = useState<View>("decks");
  const [answer, setAnswer] = useState(false);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Gespreide herhaling"
        title="Decks & review"
        description="Beheer geneste decks, werk je wachtrij weg en doorzoek al je kaarten met tags, intervallen en gemak-scores."
        action={<PrimaryButton>Deck aanmaken</PrimaryButton>}
      />

      <div className="py-6">
        <Tabs tabs={VIEWS} value={view} onChange={setView} />
      </div>

      {view === "decks" && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-5 py-3 font-medium">Deck</th>
                <th className="px-5 py-3 text-center font-medium">Nieuw</th>
                <th className="px-5 py-3 text-center font-medium">Leren</th>
                <th className="px-5 py-3 text-center font-medium">Te herhalen</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <DeckRows decks={DECKS} />
          </table>
        </div>
      )}

      {view === "review" && (
        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="rounded-lg border border-border p-10 text-center">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                VWO 4 :: Wiskunde B · kaart 7 van 63
              </p>
              <p className="mt-6 font-display text-4xl font-semibold">Kettingregel</p>
              {answer && (
                <p className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
                  f(g(x))′ = f′(g(x)) · g′(x)
                </p>
              )}
              <div className="mt-10 flex flex-wrap justify-center gap-2">
                {!answer ? (
                  <PrimaryButton onClick={() => setAnswer(true)}>Antwoord tonen</PrimaryButton>
                ) : (
                  ["Opnieuw · 1m", "Lastig · 6m", "Goed · 4d", "Makkelijk · 9d"].map((l) => (
                    <GhostButton key={l} onClick={() => setAnswer(false)}>
                      {l}
                    </GhostButton>
                  ))
                )}
              </div>
            </div>
            <Panel title="Kaart bewerken" className="mt-6">
              <div className="space-y-3">
                <div className="rounded-md border border-border p-3 text-sm">Voorkant: Kettingregel</div>
                <div className="rounded-md border border-border p-3 text-sm">
                  Achterkant: f(g(x))′ = f′(g(x)) · g′(x)
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="outline">#afgeleide</Badge>
                  <Badge tone="outline">#formule</Badge>
                  <GhostButton>Afbeeldingsocclusie</GhostButton>
                  <GhostButton>Omdraaien</GhostButton>
                </div>
                <div className="grid h-32 place-items-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                  Sleep een afbeelding hierheen om vlakken af te dekken
                </div>
              </div>
            </Panel>
          </div>
          <aside className="space-y-6">
            <Panel title="Wachtrij">
              <KeyValue
                items={[
                  ["Nieuw", 42],
                  ["Leren", 11],
                  ["Te herhalen", 63],
                  ["Verwacht vandaag", "±35 min"],
                ]}
              />
            </Panel>
            <Panel title="Prognose">
              <BarChart values={REVIEW_FORECAST} height={90} />
            </Panel>
          </aside>
        </div>
      )}

      {view === "browser" && (
        <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
          <aside>
            <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Tags</p>
            <ul className="space-y-1">
              {CARD_TAGS.map((t) => (
                <li
                  key={t.tag}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <span>#{t.tag}</span>
                  <span className="tabular-nums text-xs">{t.count}</span>
                </li>
              ))}
            </ul>
          </aside>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Voorkant</th>
                  <th className="px-5 py-3 font-medium">Achterkant</th>
                  <th className="px-5 py-3 font-medium">Deck</th>
                  <th className="px-5 py-3 text-center font-medium">Interval</th>
                  <th className="px-5 py-3 text-center font-medium">Gemak</th>
                  <th className="px-5 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CARD_BROWSER.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-5 py-3.5 font-medium">{c.front}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{c.back}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{c.deck}</td>
                    <td className="px-5 py-3.5 text-center tabular-nums text-muted-foreground">
                      {c.interval}
                    </td>
                    <td className="px-5 py-3.5 text-center tabular-nums text-muted-foreground">
                      {c.ease}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge tone={c.state === "herhalen" ? "success" : "muted"}>{c.state}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "stats" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Panel title="Activiteit (26 weken)" className="md:col-span-2">
            <Heatmap values={HEATMAP} />
          </Panel>
          <Panel title="Reviewprognose">
            <BarChart values={REVIEW_FORECAST} />
          </Panel>
          <Panel title="Kerncijfers">
            <KeyValue
              items={[
                ["Kaarten totaal", "1.284"],
                ["Volwassen kaarten", "612"],
                ["Gemiddeld interval", "9,4 dagen"],
                ["Retentie", "88%"],
                ["Reviews vandaag", "74"],
              ]}
            />
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
