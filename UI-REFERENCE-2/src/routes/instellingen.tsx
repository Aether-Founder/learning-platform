import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Badge, Field, GhostButton, Panel, PrimaryButton, Tabs, inputClass } from "@/components/ui-kit";
import { ABSENCES, ONBOARDING } from "@/lib/os-data";

export const Route = createFileRoute("/instellingen")({
  head: () => ({
    meta: [
      { title: "Instellingen — Aether" },
      {
        name: "description",
        content:
          "Beheer je profiel, schoolgegevens, studievoorkeuren, meldingen en weergave binnen Aether.",
      },
      { property: "og:title", content: "Instellingen — Aether" },
      {
        property: "og:description",
        content: "Profiel, school, studievoorkeuren, meldingen en weergave.",
      },
    ],
  }),
  component: SettingsPage,
});

const TABS = [
  { value: "profiel", label: "Profiel" },
  { value: "school", label: "School" },
  { value: "studeren", label: "Studeren" },
  { value: "meldingen", label: "Meldingen" },
] as const;
type Tab = (typeof TABS)[number]["value"];

function Toggle({ label, hint, on }: { label: string; hint: string; on?: boolean }) {
  const [v, setV] = useState(!!on);
  return (
    <button
      type="button"
      onClick={() => setV((x) => !x)}
      className="flex w-full items-center justify-between gap-4 border-b border-border py-3.5 text-left last:border-b-0"
    >
      <span>
        <span className="block text-[13px] font-medium">{label}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">{hint}</span>
      </span>
      <span
        className={
          "relative h-5 w-9 shrink-0 rounded-full transition-colors " +
          (v ? "bg-foreground" : "bg-secondary")
        }
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all"
          style={{ left: v ? 18 : 2 }}
        />
      </span>
    </button>
  );
}

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profiel");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Voorkeuren"
        title="Instellingen"
        description="Stel je werkruimte in: profiel, schoolgegevens, studieritme en meldingen."
        action={<PrimaryButton>Wijzigingen opslaan</PrimaryButton>}
      />

      <div className="py-6">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {tab === "profiel" && (
            <Panel title="Profiel">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Voornaam">
                  <input className={inputClass} defaultValue="Mohammed" />
                </Field>
                <Field label="Achternaam">
                  <input className={inputClass} defaultValue="El Amrani" />
                </Field>
                <Field label="E-mail">
                  <input className={inputClass} defaultValue="mohammed@school.nl" />
                </Field>
                <Field label="Taal">
                  <select className={inputClass}>
                    <option>Nederlands</option>
                    <option>English</option>
                  </select>
                </Field>
              </div>
            </Panel>
          )}

          {tab === "school" && (
            <>
              <Panel title="Schoolgegevens">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="School">
                    <input className={inputClass} defaultValue="Stedelijk Lyceum" />
                  </Field>
                  <Field label="Klas">
                    <input className={inputClass} defaultValue="4V-A" />
                  </Field>
                  <Field label="Niveau">
                    <select className={inputClass}>
                      <option>VWO</option>
                      <option>HAVO</option>
                    </select>
                  </Field>
                  <Field label="Profiel">
                    <select className={inputClass}>
                      <option>Natuur &amp; Techniek</option>
                      <option>Natuur &amp; Gezondheid</option>
                      <option>Economie &amp; Maatschappij</option>
                    </select>
                  </Field>
                </div>
              </Panel>
              <Panel title="Absenties">
                <ul className="divide-y divide-border">
                  {ABSENCES.map((a) => (
                    <li key={a.date} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="tabular-nums text-muted-foreground">{a.date}</span>
                      <span className="min-w-0 flex-1 truncate">{a.subject}</span>
                      <span className="text-xs text-muted-foreground">{a.note}</span>
                      <Badge tone={a.type === "Ziek" ? "warning" : "muted"}>{a.type}</Badge>
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          )}

          {tab === "studeren" && (
            <Panel title="Studievoorkeuren">
              <Toggle label="Nieuwe kaarten mengen" hint="Wissel nieuwe en bekende kaarten af" on />
              <Toggle label="Automatisch omdraaien" hint="Toon het antwoord na 8 seconden" />
              <Toggle label="Geluid bij goed antwoord" hint="Korte bevestigingstoon" />
              <Toggle label="Dagelijkse limiet" hint="Maximaal 80 kaarten per dag" on />
            </Panel>
          )}

          {tab === "meldingen" && (
            <Panel title="Meldingen">
              <Toggle label="Herinnering studieblok" hint="15 minuten van tevoren" on />
              <Toggle label="Deadline nadert" hint="Eén dag voor de inleverdatum" on />
              <Toggle label="Nieuw cijfer" hint="Zodra een docent een cijfer invoert" on />
              <Toggle label="Groepsactiviteit" hint="Als je klas een set deelt" />
            </Panel>
          )}
        </div>

        <aside className="space-y-6">
          <Panel title="Aan de slag">
            <ul className="space-y-2.5">
              {ONBOARDING.map((o) => (
                <li key={o.label} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className={
                      "grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border text-[9px] " +
                      (o.done ? "border-foreground bg-foreground text-background" : "border-border")
                    }
                  >
                    {o.done ? "✓" : ""}
                  </span>
                  <span className={o.done ? "text-muted-foreground line-through" : ""}>{o.label}</span>
                </li>
              ))}
            </ul>
            <GhostButton className="mt-4 w-full justify-center">Rondleiding opnieuw</GhostButton>
          </Panel>
          <Panel title="Weergave">
            <Toggle label="Donkere modus" hint="Volgt nu de app-instelling" on />
            <Toggle label="Compacte lijsten" hint="Minder witruimte in tabellen" />
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
