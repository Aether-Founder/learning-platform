"use client";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Field, Panel, inputClass } from "@/components/ui-kit";

export default function InstellingenPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Configuratie"
        title="Instellingen"
        description="Pas je profiel, voorkeuren en meldingen aan."
      />

      <div className="mt-10 space-y-6">
        <Panel title="Profiel">
          <div className="space-y-4">
            <Field label="Naam">
              <input className={inputClass} defaultValue="Mohammed" />
            </Field>
            <Field label="E-mail">
              <input className={inputClass} type="email" defaultValue="mohammed@school.nl" />
            </Field>
            <Field label="Klas">
              <input className={inputClass} defaultValue="VWO 4" />
            </Field>
            <Field label="Profiel">
              <select className={inputClass}>
                <option>Natuur & Techniek</option>
                <option>Natuur & Gezondheid</option>
                <option>Economie & Maatschappij</option>
                <option>Cultuur & Maatschappij</option>
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title="Voorkeuren">
          <div className="space-y-4">
            <Field label="Thema">
              <select className={inputClass}>
                <option>Donker</option>
                <option>Licht</option>
                <option>Systeem</option>
              </select>
            </Field>
            <Field label="Taal">
              <select className={inputClass}>
                <option>Nederlands</option>
                <option>English</option>
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title="Meldingen">
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              <span className="text-sm">Dagelijkse herinnering om te oefenen</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              <span className="text-sm">Nieuwe cijfers en toetsen</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" />
              <span className="text-sm">Gedeelde sets en groepsactiviteit</span>
            </label>
          </div>
        </Panel>

        <div>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Wijzigingen opslaan
          </button>
        </div>
      </div>
    </AppShell>
  );
}
