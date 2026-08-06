"use client";

import { useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { exportStudySet, parseCardsFromJson, parseCardsFromText } from "@/lib/learning-platform/import-export";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";

export function StudySetTools() {
  const studySet = useLearningPlatformStore((state) => state.studySet);
  const addImportedTerms = useLearningPlatformStore((state) => state.addImportedTerms);
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"tsv" | "csv" | "json">("tsv");
  const [message, setMessage] = useState("");

  const exportText = useMemo(() => (studySet ? exportStudySet(studySet, format) : ""), [studySet, format]);

  if (!studySet) return null;

  const importCards = () => {
    const parsed = format === "json"
      ? parseCardsFromJson(text, "imported", "Geimporteerd")
      : parseCardsFromText(text, "imported", "Geimporteerd");
    if (parsed.terms.length > 0) {
      addImportedTerms(parsed.terms);
      setText("");
    }
    setMessage(`${parsed.terms.length} kaarten toegevoegd${parsed.warnings.length ? `, ${parsed.warnings.length} waarschuwingen` : ""}.`);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-medium text-foreground">Import / export</h4>
          <p className="text-xs text-muted-foreground">Plak TSV, CSV of Anki-vriendelijke JSON kaarten.</p>
        </div>
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value as "tsv" | "csv" | "json")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="tsv">TSV</option>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={format === "json" ? '{"cards":[{"front":"Vraag","back":"Antwoord"}]}' : "Vraag\tAntwoord"}
        className="min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={importCards}
          disabled={!text.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          Importeren
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(exportText).then(() => setMessage("Export gekopieerd."))}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
        >
          <Download className="h-4 w-4" />
          Kopieer export
        </button>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
