"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Edit2,
  Flame,
  Folder,
  FolderOpen,
  Home,
  ListChecks,
  Loader2,
  MoreHorizontal,
  MoveRight,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { MarkdownContent } from "./shared/MarkdownContent";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { LearnMode } from "./modes/LearnMode";
import { McqOnlyMode } from "./modes/McqOnlyMode";
import { WritingOnlyMode } from "./modes/WritingOnlyMode";
import { TestMode } from "./modes/TestMode";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SchoolLevel = "HAVO" | "VWO";
export type SchoolYear = 4 | 5 | 6;
export type SchoolProfile = "CM" | "EM" | "NG" | "NT";

export interface UserAccountProfile {
  username: string;
  schoolLevel: SchoolLevel;
  year: SchoolYear;
  schoolProfile: SchoolProfile;
  selectedSubjects: string[];
  isOnboarded: boolean;
}

export interface SourceLearningSet {
  id: string;
  pageName: string;
  pageTitle: string;
  title: string;
  description?: string;
  terms: Array<{ id: string; term: string; definition: string; image?: string }>;
}

export interface LocalCard {
  id: string;
  term: string;
  definition: string;
  image?: string;
  starred?: boolean;
  attempts: number;
  correct: number;
  lastStudied?: string;
}

export interface LocalStudySet {
  id: string;
  title: string;
  description?: string;
  source?: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  cards: LocalCard[];
}

export interface LocalFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

export const ALL_SUBJECTS = [
  "Nederlands", "Engels", "Frans", "Duits",
  "Wiskunde A", "Wiskunde B", "Wiskunde C", "Rekenen",
  "Geschiedenis", "Aardrijkskunde", "Economie", "Bedrijfseconomie (BS)",
  "Biologie", "Scheikunde", "Natuurkunde (NaSk)",
  "Beeldende Vorming", "Levensbeschouwing",
];

export const PROFILE_RECOMMENDED_SUBJECTS: Record<SchoolProfile, string[]> = {
  CM: ["Nederlands", "Engels", "Geschiedenis", "Frans", "Duits", "Beeldende Vorming", "Wiskunde A", "Levensbeschouwing"],
  EM: ["Nederlands", "Engels", "Economie", "Geschiedenis", "Wiskunde A", "Bedrijfseconomie (BS)", "Aardrijkskunde"],
  NG: ["Nederlands", "Engels", "Biologie", "Scheikunde", "Natuurkunde (NaSk)", "Wiskunde A", "Aardrijkskunde"],
  NT: ["Nederlands", "Engels", "Natuurkunde (NaSk)", "Scheikunde", "Wiskunde B", "Wiskunde A", "Biologie"],
};

// ─── Storage ─────────────────────────────────────────────────────────────────

const USER_PROFILE_KEY = "aether-user-profile-v1";
const SETS_KEY = "standalone-learning-platform-v1";
const FOLDERS_KEY = "aether-folders-v2";

export function loadUserProfile(): UserAccountProfile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return defaultProfile();
    const p = JSON.parse(raw);
    return {
      username: p.username || "",
      schoolLevel: p.schoolLevel || "VWO",
      year: p.year || 5,
      schoolProfile: p.schoolProfile || "NT",
      selectedSubjects: Array.isArray(p.selectedSubjects) && p.selectedSubjects.length > 0
        ? p.selectedSubjects : PROFILE_RECOMMENDED_SUBJECTS.NT,
      isOnboarded: Boolean(p.isOnboarded),
    };
  } catch { return defaultProfile(); }
}

function defaultProfile(): UserAccountProfile {
  return { username: "", schoolLevel: "VWO", year: 5, schoolProfile: "NT",
    selectedSubjects: PROFILE_RECOMMENDED_SUBJECTS.NT, isOnboarded: false };
}

export function saveUserProfile(profile: UserAccountProfile) {
  if (typeof window !== "undefined") localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

export function loadSets(): LocalStudySet[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SETS_KEY) || "[]"); } catch { return []; }
}

export function saveSets(sets: LocalStudySet[]) {
  if (typeof window !== "undefined") localStorage.setItem(SETS_KEY, JSON.stringify(sets));
}

export function loadFolders(): LocalFolder[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]"); } catch { return []; }
}

export function saveFolders(folders: LocalFolder[]) {
  if (typeof window !== "undefined") localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function shuffle<T>(items: T[]): T[] {
  const r = [...items];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function accuracy(set: LocalStudySet) {
  const attempts = set.cards.reduce((s, c) => s + c.attempts, 0);
  if (!attempts) return 0;
  return Math.round((set.cards.reduce((s, c) => s + c.correct, 0) / attempts) * 100);
}

function toLocalSet(input: {
  title: string; description?: string; source?: string; folderId?: string;
  cards: Array<{ id?: string; term: string; definition: string; image?: string }>;
}): LocalStudySet {
  const now = new Date().toISOString();
  return {
    id: createId("set"), title: input.title.trim() || "Nieuwe studieset",
    description: input.description?.trim(), source: input.source, folderId: input.folderId,
    createdAt: now, updatedAt: now,
    cards: input.cards.filter(c => c.term.trim() && c.definition.trim()).map((c, i) => ({
      id: c.id || createId(`card-${i}`), term: c.term.trim(), definition: c.definition.trim(),
      image: c.image, attempts: 0, correct: 0,
    })),
  };
}

// ─── AccountProfileModal ─────────────────────────────────────────────────────

function AccountProfileModal({ currentProfile, onSave, onClose }: {
  currentProfile: UserAccountProfile;
  onSave: (p: UserAccountProfile) => void;
  onClose: () => void;
}) {
  const [username, setUsername] = useState(currentProfile.username || "");
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>(currentProfile.schoolLevel);
  const [year, setYear] = useState<SchoolYear>(currentProfile.year);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(currentProfile.schoolProfile);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    currentProfile.selectedSubjects.length > 0
      ? currentProfile.selectedSubjects
      : PROFILE_RECOMMENDED_SUBJECTS[currentProfile.schoolProfile]
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const toggleSubject = (sub: string) =>
    setSelectedSubjects(p => p.includes(sub) ? p.filter(s => s !== sub) : [...p, sub]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onSave({ username: username.trim(), schoolLevel, year, schoolProfile,
      selectedSubjects: selectedSubjects.length > 0 ? selectedSubjects : ALL_SUBJECTS.slice(0, 5),
      isOnboarded: true });
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget && currentProfile.isOnboarded) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            {currentProfile.isOnboarded ? "Account & Profiel" : "Account Aanmaken"}
          </h2>
          {currentProfile.isOnboarded && (
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Gebruikersnaam</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Voer je naam in"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Schoolniveau</label>
              <div className="grid grid-cols-2 gap-2">
                {(["HAVO", "VWO"] as const).map(lvl => (
                  <button key={lvl} type="button" onClick={() => setSchoolLevel(lvl)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${schoolLevel === lvl ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:bg-secondary"}`}>
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Leerjaar</label>
              <div className="grid grid-cols-3 gap-2">
                {([4, 5, 6] as const).map(yr => {
                  const disabled = schoolLevel === "HAVO" && yr === 6;
                  return (
                    <button key={yr} type="button" disabled={disabled} onClick={() => setYear(yr)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${disabled ? "opacity-30 cursor-not-allowed border-border bg-background text-muted-foreground" : year === yr ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:bg-secondary"}`}>
                      {yr}e
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Schoolprofiel</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([["CM","Cultuur & Maatschappij"],["EM","Economie & Maatschappij"],["NG","Natuur & Gezondheid"],["NT","Natuur & Techniek"]] as const).map(([prof, label]) => (
                <button key={prof} type="button" onClick={() => { setSchoolProfile(prof); setSelectedSubjects(PROFILE_RECOMMENDED_SUBJECTS[prof]); }}
                  className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${schoolProfile === prof ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:bg-secondary"}`}>
                  <span className="text-base font-bold">{prof}</span>
                  <span className="text-[10px] opacity-80 line-clamp-1">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-foreground">Gekozen vakken ({selectedSubjects.length})</label>
              <button type="button" onClick={() => setSelectedSubjects([...ALL_SUBJECTS])} className="text-xs font-medium text-muted-foreground hover:text-foreground">Alles selecteren</button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-44 overflow-y-auto p-1 border border-border rounded-lg bg-background">
              {ALL_SUBJECTS.map(sub => {
                const sel = selectedSubjects.includes(sub);
                return (
                  <button key={sub} type="button" onClick={() => toggleSubject(sub)}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-medium transition-all ${sel ? "border-foreground bg-secondary text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${sel ? "border-foreground bg-foreground text-background" : "border-border"}`}>
                      {sel && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            {currentProfile.isOnboarded && (
              <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary">Annuleren</button>
            )}
            <button type="submit" disabled={!username.trim()} className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-bold text-background disabled:opacity-50">
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── StreakModal ──────────────────────────────────────────────────────────────

function StreakModal({ streak, onClose }: { streak: number; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl my-auto text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
          <Flame className="h-10 w-10" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-foreground">{streak} Dagen Streak!</h2>
        <p className="mt-2 text-sm text-muted-foreground">Geweldig bezig! Blijf elke dag oefenen.</p>
        <button onClick={onClose} className="mt-6 w-full rounded-lg bg-foreground py-2.5 text-sm font-bold text-background">Doorgaan met leren</button>
      </div>
    </div>
  );
}

// ─── CreateSetPage ────────────────────────────────────────────────────────────

// ─── Import parser helpers ────────────────────────────────────────────────────

function parseImportText(
  raw: string,
  termSep: string,
  cardSep: string
): Array<{ id: string; term: string; definition: string }> {
  const cardDelimiter = cardSep === "\\n" ? "\n" : cardSep === "\\t" ? "\t" : cardSep;
  const termDelimiter = termSep === "\\t" ? "\t" : termSep === "\\n" ? "\n" : termSep;
  return raw
    .split(cardDelimiter)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const sepIndex = line.indexOf(termDelimiter);
      if (sepIndex === -1) return null;
      return {
        id: createId("imp"),
        term: line.slice(0, sepIndex).trim(),
        definition: line.slice(sepIndex + termDelimiter.length).trim(),
      };
    })
    .filter((c): c is { id: string; term: string; definition: string } =>
      c !== null && c.term !== "" && c.definition !== ""
    );
}

function parseJsonImport(raw: string): Array<{ id: string; term: string; definition: string }> | string {
  try {
    const parsed = JSON.parse(raw);
    const arr = parsed.cards || parsed.terms || (Array.isArray(parsed) ? parsed : []);
    if (!Array.isArray(arr)) return "JSON moet een 'cards' of 'terms' lijst bevatten.";
    const result = arr
      .map((c: any) => ({
        id: createId("imp"),
        term: (c.term || c.front || c.question || "").trim(),
        definition: (c.definition || c.back || c.answer || "").trim(),
      }))
      .filter((c: any) => c.term && c.definition);
    if (result.length === 0) return "Geen geldige kaarten gevonden in de JSON.";
    return result;
  } catch {
    return "Ongeldige JSON — controleer de opmaak.";
  }
}

// ─── ImportPanel (used inside CreateSetPage) ──────────────────────────────────

function ImportPanel({ onImport }: {
  onImport: (cards: Array<{ id: string; term: string; definition: string }>) => void;
}) {
  const [tab, setTab] = useState<"text" | "json">("text");
  const [rawText, setRawText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [termSep, setTermSep] = useState("\\t");
  const [cardSep, setCardSep] = useState("\\n");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Array<{ id: string; term: string; definition: string }>>([]);

  // Live preview for text import
  const updatePreview = (text: string, ts: string, cs: string) => {
    setError("");
    if (!text.trim()) { setPreview([]); return; }
    const result = parseImportText(text, ts, cs);
    setPreview(result);
  };

  const handleTextChange = (v: string) => { setRawText(v); updatePreview(v, termSep, cardSep); };
  const handleTermSepChange = (v: string) => { setTermSep(v); updatePreview(rawText, v, cardSep); };
  const handleCardSepChange = (v: string) => { setCardSep(v); updatePreview(rawText, termSep, v); };

  const handleImportText = () => {
    if (preview.length === 0) { setError("Geen kaarten herkend. Controleer de scheidingstekens."); return; }
    onImport(preview);
    setRawText(""); setPreview([]); setError("");
  };

  const handleImportJson = () => {
    const result = parseJsonImport(jsonText);
    if (typeof result === "string") { setError(result); return; }
    onImport(result);
    setJsonText(""); setError("");
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {([["text", "Tekst / Quizlet"], ["json", "JSON"]] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setTab(id); setError(""); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === id ? "bg-background text-foreground border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {tab === "text" && (
          <>
            <p className="text-xs text-muted-foreground">
              Plak tekst uit Quizlet, Word, of Excel. Elke rij is een kaart. Standaard scheiding: <strong>tab</strong> tussen term en definitie, <strong>nieuwe regel</strong> tussen kaarten.
            </p>

            {/* Separator pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Term ↔ Definitie</label>
                <div className="flex gap-1.5 flex-wrap">
                  {([["\\t", "Tab"], ["—", "Streepje"], [";", "Puntkomma"], [",", "Komma"]] as const).map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => handleTermSepChange(val)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${termSep === val ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:bg-secondary"}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Kaart ↔ Kaart</label>
                <div className="flex gap-1.5 flex-wrap">
                  {([["\\n", "Nieuwe regel"], [";", "Puntkomma"]] as const).map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => handleCardSepChange(val)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${cardSep === val ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:bg-secondary"}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <textarea
              value={rawText}
              onChange={e => handleTextChange(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
              placeholder={"cel\tkleinste eenheid van leven\nfotosynthese\tomzetting van licht naar energie"}
            />

            {/* Live preview */}
            {preview.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">{preview.length} kaarten herkend:</p>
                <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-border bg-background p-3">
                  {preview.slice(0, 8).map((c, i) => (
                    <div key={c.id} className="grid grid-cols-2 gap-3 text-xs py-1 border-b border-border/50 last:border-0">
                      <span className="font-medium text-foreground truncate">{c.term}</span>
                      <span className="text-muted-foreground truncate">{c.definition}</span>
                    </div>
                  ))}
                  {preview.length > 8 && <p className="text-xs text-muted-foreground pt-1">+{preview.length - 8} meer...</p>}
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button type="button" onClick={handleImportText} disabled={preview.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-bold text-background disabled:opacity-40">
              <Upload className="h-4 w-4" /> {preview.length > 0 ? `${preview.length} kaarten importeren` : "Importeren"}
            </button>
          </>
        )}

        {tab === "json" && (
          <>
            <p className="text-xs text-muted-foreground">
              Plak een JSON-object met een <code className="bg-secondary px-1 rounded">cards</code> of <code className="bg-secondary px-1 rounded">terms</code> array. Elk item heeft <code className="bg-secondary px-1 rounded">term</code>/<code className="bg-secondary px-1 rounded">definition</code> of <code className="bg-secondary px-1 rounded">front</code>/<code className="bg-secondary px-1 rounded">back</code> velden.
            </p>
            <textarea
              value={jsonText}
              onChange={e => { setJsonText(e.target.value); setError(""); }}
              rows={7}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
              placeholder={'{"title":"Biologie H4","cards":[{"front":"Cel","back":"Kleinste levende eenheid"}]}'}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="button" onClick={handleImportJson} disabled={!jsonText.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-bold text-background disabled:opacity-40">
              <Upload className="h-4 w-4" /> Importeren
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CreateSetPage ────────────────────────────────────────────────────────────

function CreateSetPage({ onSave, onCancel }: {
  onSave: (set: LocalStudySet) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<Array<{ id: string; term: string; definition: string }>>([
    { id: createId("draft"), term: "", definition: "" },
    { id: createId("draft"), term: "", definition: "" },
  ]);
  const [showImport, setShowImport] = useState(false);

  const updateCard = (id: string, field: "term" | "definition", value: string) =>
    setCards(c => c.map(card => card.id === id ? { ...card, [field]: value } : card));

  const addCard = () => setCards(c => [...c, { id: createId("draft"), term: "", definition: "" }]);
  const removeCard = (id: string) => setCards(c => c.filter(card => card.id !== id));

  const handleImport = (imported: Array<{ id: string; term: string; definition: string }>) => {
    // Merge: drop blank placeholder cards first, then append imported
    setCards(prev => {
      const nonEmpty = prev.filter(c => c.term.trim() || c.definition.trim());
      return [...nonEmpty, ...imported];
    });
    setShowImport(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const set = toLocalSet({ title, description, cards });
    if (set.cards.length === 0) return;
    onSave(set);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 pt-8 text-xs text-muted-foreground">
          <button onClick={onCancel} className="underline-offset-4 hover:text-foreground hover:underline">
            Overzicht
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">Nieuwe studieset</span>
        </nav>

        <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Maken
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1]">Nieuwe studieset</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Voeg kaarten toe en begin met oefenen in verschillende leermodi.
            </p>
          </div>
        </section>

        <form onSubmit={submit} className="mt-10 space-y-6">
          {/* Title + description */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Titel</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:border-foreground/40"
                placeholder="Bijv. Frans woordjes hoofdstuk 3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Beschrijving <span className="text-muted-foreground font-normal">(optioneel)</span>
              </label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:border-foreground/40"
                placeholder="Hoofdstuk, toets of onderwerp"
              />
            </div>
          </div>

          {/* Import toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowImport(v => !v)}
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${showImport ? "border-foreground bg-foreground text-background" : "border-border hover:bg-secondary"}`}
            >
              <Upload className="h-4 w-4" />
              {showImport ? "Importeren verbergen" : "Kaarten importeren"}
            </button>
            {!showImport && (
              <span className="ml-3 text-xs text-muted-foreground">
                Plak tekst uit Quizlet, Word, Excel of JSON
              </span>
            )}
          </div>

          {showImport && <ImportPanel onImport={handleImport} />}

          {/* Card editor */}
          <div className="space-y-3">
            {cards.map((card, index) => (
              <div key={card.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-muted-foreground">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeCard(card.id)}
                    className="rounded-md p-1 text-muted-foreground hover:text-red-500 hover:bg-secondary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                      Term
                    </label>
                    <input
                      value={card.term}
                      onChange={e => updateCard(card.id, "term", e.target.value)}
                      className="w-full rounded-lg border-b-2 border-border bg-transparent px-1 py-2 text-foreground focus:outline-none focus:border-foreground"
                      placeholder="Voer term in"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                      Definitie
                    </label>
                    <input
                      value={card.definition}
                      onChange={e => updateCard(card.id, "definition", e.target.value)}
                      className="w-full rounded-lg border-b-2 border-border bg-transparent px-1 py-2 text-foreground focus:outline-none focus:border-foreground"
                      placeholder="Voer definitie in"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCard}
            className="w-full rounded-lg border-2 border-dashed border-border bg-background py-4 text-sm font-semibold text-muted-foreground hover:border-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Kaart toevoegen
          </button>

          <div className="flex gap-3 justify-end pb-8 border-t border-border pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="h-10 rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── LessenPage ───────────────────────────────────────────────────────────────

function LessenPage({ onBack }: { onBack: () => void }) {
  const lessons = [
    { id: 1, subject: "Wiskunde B", title: "Differentiëren – Basisregels", duration: "45 min", progress: 60, level: "VWO 5" },
    { id: 2, subject: "Biologie", title: "Fotosynthese & Celademhaling", duration: "30 min", progress: 0, level: "VWO 5" },
    { id: 3, subject: "Scheikunde", title: "Zuren en Basen", duration: "40 min", progress: 25, level: "VWO 5" },
    { id: 4, subject: "Geschiedenis", title: "Tweede Wereldoorlog – Oorzaken", duration: "35 min", progress: 100, level: "VWO 5" },
    { id: 5, subject: "Engels", title: "Grammatica: Present Perfect", duration: "20 min", progress: 80, level: "VWO 5" },
    { id: 6, subject: "Economie", title: "Vraag & Aanbod", duration: "35 min", progress: 0, level: "VWO 5" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <nav className="flex items-center gap-1.5 pt-8 text-xs text-muted-foreground">
        <button onClick={onBack} className="underline-offset-4 hover:text-foreground hover:underline">
          Overzicht
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">Lessen</span>
      </nav>

      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-8">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Bibliotheek
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1]">Lessen</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Gestructureerde lessen per vak met uitleg en oefeningen.
          </p>
        </div>
      </section>

      <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map(lesson => (
          <article key={lesson.id} className="bg-background p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {lesson.subject}
            </p>
            <h3 className="mt-2 text-[15px] font-semibold leading-snug">{lesson.title}</h3>
            <p className="mt-3 text-xs text-muted-foreground">
              {lesson.duration} · {lesson.level}
            </p>
            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between text-xs text-muted-foreground">
                <span>Voortgang</span>
                <span className="tabular-nums">{lesson.progress}%</span>
              </div>
              <Meter value={lesson.progress} />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-dashed border-border bg-background/50 p-8 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="font-display text-xl font-semibold text-foreground">Meer lessen komen eraan</h3>
        <p className="mt-1 text-sm text-muted-foreground">We werken aan meer lessen voor al je vakken.</p>
      </div>
    </div>
  );
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────

function CalendarPage({ onBack }: { onBack: () => void }) {
  // Get current month calendar data
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const events = [
    { date: 3, title: "SO Scheikunde — zuren & basen", time: "09:15", type: "toets" as const },
    { date: 4, title: "Practicum titraties", time: "11:00", type: "les" as const },
    { date: 6, title: "Inleveren essay literatuur", time: "23:59", type: "deadline" as const },
    { date: 7, title: "Repetitie Wiskunde B", time: "08:30", type: "toets" as const },
    { date: 10, title: "Presentatie Engels", time: "13:20", type: "activiteit" as const },
    { date: 12, title: "Proefwerkweek start", time: "08:00", type: "examen" as const },
  ];

  const monthNames = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
  const dayNames = ["zo", "ma", "di", "wo", "do", "vr", "za"];

  return (
    <div className="mx-auto max-w-[1400px] px-8 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 pt-8 text-xs text-muted-foreground">
        <button onClick={onBack} className="underline-offset-4 hover:text-foreground hover:underline">
          Overzicht
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">Kalender</span>
      </nav>

      {/* Header */}
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-8">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Planning
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif' }} className="mt-3 text-5xl font-semibold leading-[1.1]">Kalender</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Overzicht van toetsen, deadlines en andere schoolactiviteiten.
          </p>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Calendar grid */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif' }} className="text-3xl font-semibold capitalize">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="flex gap-2">
              <button className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-secondary">
                Vorige
              </button>
              <button className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-secondary">
                Volgende
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
              {dayNames.map(day => (
                <div key={day} className="border-r border-border p-3 text-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: (firstDayOfMonth + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="border-r border-b border-border bg-secondary/10 p-3 min-h-[100px]" />
              ))}
              
              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNumber = i + 1;
                const dayEvents = events.filter(e => e.date === dayNumber);
                const isToday = dayNumber === today.getDate();
                
                return (
                  <div
                    key={dayNumber}
                    className={`border-r border-b border-border p-3 min-h-[100px] last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}
                  >
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                      {dayNumber}
                    </span>
                    <div className="mt-2 space-y-1">
                      {dayEvents.map((event, idx) => (
                        <div
                          key={idx}
                          className={`rounded px-2 py-1 text-[11px] font-medium leading-tight ${
                            event.type === "toets" || event.type === "examen"
                              ? "bg-orange-500/10 text-orange-600"
                              : event.type === "deadline"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {event.time} {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming events sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif' }} className="mb-5 border-b border-border pb-4 text-2xl font-semibold">
            Binnenkort
          </h2>
          <div className="space-y-3">
            {events.slice(0, 6).map((event, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-secondary/20 p-4">
                <p className="text-[13px] font-semibold">{event.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.date} {monthNames[currentMonth]} · {event.time}
                </p>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  event.type === "toets" || event.type === "examen"
                    ? "bg-orange-500/10 text-orange-600"
                    : event.type === "deadline"
                    ? "bg-blue-500/10 text-blue-600"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Subject directory seed data ─────────────────────────────────────────────
// This builds the full folder + placeholder set hierarchy the first time the
// explorer opens (if the user has no folders yet).

interface SubjectTree {
  subject: string;
  units: { name: string; sets: string[] }[];
}

const SUBJECT_DIRECTORY: SubjectTree[] = [
  {
    subject: "Nederlands",
    units: [
      { name: "Hoofdstuk 1 – Lezen", sets: ["Leesstrategieën", "Tekstsoorten"] },
      { name: "Hoofdstuk 2 – Schrijven", sets: ["Argumentatietechnieken", "Tekstopbouw"] },
      { name: "Hoofdstuk 3 – Grammatica", sets: ["Zinsdelen", "Werkwoordspelling"] },
      { name: "Hoofdstuk 4 – Literatuur", sets: ["Literaire begrippen", "Stromingen"] },
    ],
  },
  {
    subject: "Engels",
    units: [
      { name: "Unit 1 – Reading", sets: ["Reading strategies", "Vocabulary unit 1"] },
      { name: "Unit 2 – Grammar", sets: ["Present perfect vs simple past", "Conditionals"] },
      { name: "Unit 3 – Writing", sets: ["Essay structure", "Linking words"] },
      { name: "Unit 4 – Vocabulary", sets: ["Academic wordlist", "Idioms & phrases"] },
    ],
  },
  {
    subject: "Frans",
    units: [
      { name: "Chapitre 1", sets: ["Vocabulaire 1", "Grammaire: les verbes"] },
      { name: "Chapitre 2", sets: ["Vocabulaire 2", "Les temps du passé"] },
      { name: "Chapitre 3", sets: ["Vocabulaire 3", "Le subjonctif"] },
    ],
  },
  {
    subject: "Duits",
    units: [
      { name: "Kapitel 1", sets: ["Wortschatz 1", "Grammatik: Fälle"] },
      { name: "Kapitel 2", sets: ["Wortschatz 2", "Perfekt & Präteritum"] },
      { name: "Kapitel 3", sets: ["Wortschatz 3", "Konjunktiv II"] },
    ],
  },
  {
    subject: "Wiskunde A",
    units: [
      { name: "Hoofdstuk 1 – Algebra", sets: ["Vergelijkingen", "Ongelijkheden"] },
      { name: "Hoofdstuk 2 – Statistiek", sets: ["Gemiddelde & spreiding", "Kansrekening"] },
      { name: "Hoofdstuk 3 – Verbanden", sets: ["Lineaire verbanden", "Kwadratische verbanden"] },
    ],
  },
  {
    subject: "Wiskunde B",
    units: [
      { name: "Hoofdstuk 1 – Functies", sets: ["Soorten functies", "Domein & bereik"] },
      { name: "Hoofdstuk 2 – Differentiëren", sets: ["Basisregels", "Kettingregel & productregel"] },
      { name: "Hoofdstuk 3 – Integreren", sets: ["Primitieven", "Bepaald integraal"] },
      { name: "Hoofdstuk 4 – Meetkunde", sets: ["Vectoren", "Lijnen & vlakken"] },
    ],
  },
  {
    subject: "Wiskunde C",
    units: [
      { name: "Hoofdstuk 1 – Kansrekening", sets: ["Kansen berekenen", "Combinatoriek"] },
      { name: "Hoofdstuk 2 – Statistiek", sets: ["Normale verdeling", "Toetsen & hypothesen"] },
    ],
  },
  {
    subject: "Rekenen",
    units: [
      { name: "Getallen & bewerkingen", sets: ["Breuken & procenten", "Verhoudingen"] },
      { name: "Meten & meetkunde", sets: ["Oppervlakte & inhoud", "Eenheden omrekenen"] },
    ],
  },
  {
    subject: "Biologie",
    units: [
      { name: "Hoofdstuk 1 – Cel & stofwisseling", sets: ["Celonderdelen", "Fotosynthese & ademhaling"] },
      { name: "Hoofdstuk 2 – Erfelijkheid", sets: ["DNA & genen", "Dominant & recessief"] },
      { name: "Hoofdstuk 3 – Evolutie", sets: ["Natuurlijke selectie", "Soortvorming"] },
      { name: "Hoofdstuk 4 – Ecologie", sets: ["Voedselketens", "Ecosystemen"] },
      { name: "Hoofdstuk 5 – Voortplanting", sets: ["Menselijke voortplanting", "Ontwikkeling"] },
    ],
  },
  {
    subject: "Scheikunde",
    units: [
      { name: "Hoofdstuk 1 – Atoommodel", sets: ["Deeltjesmodel", "Periodiek systeem"] },
      { name: "Hoofdstuk 2 – Bindingen", sets: ["Ionbinding", "Covalente binding"] },
      { name: "Hoofdstuk 3 – Reacties", sets: ["Reactievergelijkingen", "Zuren & basen"] },
      { name: "Hoofdstuk 4 – Organische chemie", sets: ["Koolwaterstoffen", "Functionele groepen"] },
    ],
  },
  {
    subject: "Natuurkunde (NaSk)",
    units: [
      { name: "Hoofdstuk 1 – Mechanica", sets: ["Krachten & beweging", "Energie & arbeid"] },
      { name: "Hoofdstuk 2 – Elektriciteit", sets: ["Spanning & stroom", "Weerstand & Ohm"] },
      { name: "Hoofdstuk 3 – Golven & optica", sets: ["Lichtbreking", "Geluid & trillingen"] },
      { name: "Hoofdstuk 4 – Warmteleer", sets: ["Soortelijke warmte", "Warmteoverdracht"] },
    ],
  },
  {
    subject: "Geschiedenis",
    units: [
      { name: "Hoofdstuk 1 – Oude Geschiedenis", sets: ["Grieken & Romeinen", "Middeleeuwen"] },
      { name: "Hoofdstuk 2 – Vroegmoderne tijd", sets: ["Renaissance & Reformatie", "VOC & kolonialisme"] },
      { name: "Hoofdstuk 3 – 19e eeuw", sets: ["Industrialisatie", "Nationalisme"] },
      { name: "Hoofdstuk 4 – 20e eeuw", sets: ["WO I & WO II", "Koude Oorlog"] },
      { name: "Hoofdstuk 5 – Na 1945", sets: ["Dekolonisatie", "Europese integratie"] },
    ],
  },
  {
    subject: "Aardrijkskunde",
    units: [
      { name: "Hoofdstuk 1 – Fysische geografie", sets: ["Klimaatzones", "Geomorfologie"] },
      { name: "Hoofdstuk 2 – Bevolking", sets: ["Demografische transitie", "Migratie"] },
      { name: "Hoofdstuk 3 – Stedelijke geografie", sets: ["Verstedelijking", "Stadsstructuur"] },
      { name: "Hoofdstuk 4 – Mondiale vraagstukken", sets: ["Duurzaamheid", "Globalisering"] },
    ],
  },
  {
    subject: "Economie",
    units: [
      { name: "Hoofdstuk 1 – Markt & prijs", sets: ["Vraag & aanbod", "Prijsmechanisme"] },
      { name: "Hoofdstuk 2 – Bedrijf & productie", sets: ["Kosten & opbrengsten", "Productieprocessen"] },
      { name: "Hoofdstuk 3 – Overheid", sets: ["Begrotingsbeleid", "Belastingen"] },
      { name: "Hoofdstuk 4 – Internationaal", sets: ["Handel & valuta", "EU & globalisering"] },
    ],
  },
  {
    subject: "Bedrijfseconomie (BS)",
    units: [
      { name: "Deel 1 – Boekhouding", sets: ["Balans & resultatenrekening", "Debet & credit"] },
      { name: "Deel 2 – Financiering", sets: ["Eigen & vreemd vermogen", "Investeringsberekeningen"] },
    ],
  },
  {
    subject: "Beeldende Vorming",
    units: [
      { name: "Beeldaspecten", sets: ["Kleur & compositie", "Vorm & ruimte"] },
      { name: "Kunstgeschiedenis", sets: ["Impressionisme", "Moderne kunst"] },
    ],
  },
  {
    subject: "Levensbeschouwing",
    units: [
      { name: "Deel 1 – Filosofie", sets: ["Grote denkers", "Ethiek & moraal"] },
      { name: "Deel 2 – Religies", sets: ["Wereldreligies", "Levensvragen"] },
    ],
  },
];

function seedSubjectFolders(
  userSubjects: string[],
  existingFolders: LocalFolder[]
): LocalFolder[] {
  // Only seed subjects the user has selected and that don't already have a folder
  const existingNames = new Set(existingFolders.map(f => f.name));
  const newFolders: LocalFolder[] = [];

  for (const tree of SUBJECT_DIRECTORY) {
    if (!userSubjects.includes(tree.subject)) continue;
    if (existingNames.has(tree.subject)) continue;

    const subjectFolder: LocalFolder = {
      id: createId("sf"),
      name: tree.subject,
      createdAt: new Date().toISOString(),
    };
    newFolders.push(subjectFolder);

    for (const unit of tree.units) {
      const unitFolder: LocalFolder = {
        id: createId("uf"),
        name: unit.name,
        parentId: subjectFolder.id,
        createdAt: new Date().toISOString(),
      };
      newFolders.push(unitFolder);
    }
  }

  return newFolders;
}

// ─── FolderExplorer ───────────────────────────────────────────────────────────

interface FolderExplorerProps {
  folders: LocalFolder[];
  sets: LocalStudySet[];
  onFoldersChange: (folders: LocalFolder[]) => void;
  onSetsChange: (sets: LocalStudySet[]) => void;
  onSelectSet: (setId: string) => void;
  onBack: () => void;
  onCreateSet: () => void;
  userSubjects?: string[];
}

function FolderExplorer({ folders, sets, onFoldersChange, onSetsChange, onSelectSet, onBack, onCreateSet, userSubjects = [] }: FolderExplorerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [movingSetId, setMovingSetId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ type: "folder" | "set"; id: string; x: number; y: number } | null>(null);

  // Seed subject folders on first open
  useEffect(() => {
    if (userSubjects.length === 0) return;
    const seeded = seedSubjectFolders(userSubjects, folders);
    if (seeded.length > 0) {
      onFoldersChange([...folders, ...seeded]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // breadcrumb path
  const buildPath = (folderId: string | null): LocalFolder[] => {
    if (!folderId) return [];
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return [];
    return [...buildPath(folder.parentId ?? null), folder];
  };
  const path = buildPath(currentFolderId);

  const childFolders = folders.filter(f => (f.parentId ?? null) === currentFolderId);
  const currentSets = sets.filter(s => (s.folderId ?? null) === currentFolderId);

  const createFolder = (e: FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folder: LocalFolder = { id: createId("folder"), name: newFolderName.trim(), parentId: currentFolderId ?? undefined, createdAt: new Date().toISOString() };
    onFoldersChange([...folders, folder]);
    setNewFolderName("");
    setShowNewFolder(false);
  };

  const deleteFolder = (folderId: string) => {
    // Move child sets to parent
    const updatedSets = sets.map(s => s.folderId === folderId ? { ...s, folderId: folders.find(f => f.id === folderId)?.parentId } : s);
    // Remove child folders recursively
    const toRemove = new Set<string>();
    const collect = (id: string) => { toRemove.add(id); folders.filter(f => f.parentId === id).forEach(f => collect(f.id)); };
    collect(folderId);
    onFoldersChange(folders.filter(f => !toRemove.has(f.id)));
    onSetsChange(updatedSets);
    if (currentFolderId && toRemove.has(currentFolderId)) setCurrentFolderId(null);
  };

  const startRename = (id: string, name: string) => { setRenamingId(id); setRenameValue(name); setContextMenu(null); };
  const commitRename = (id: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    onFoldersChange(folders.map(f => f.id === id ? { ...f, name: renameValue.trim() } : f));
    setRenamingId(null);
  };

  const duplicateSet = (setId: string) => {
    const orig = sets.find(s => s.id === setId);
    if (!orig) return;
    const copy: LocalStudySet = { ...orig, id: createId("set"), title: `${orig.title} (kopie)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    onSetsChange([...sets, copy]);
    setContextMenu(null);
  };

  const deleteSet = (setId: string) => { onSetsChange(sets.filter(s => s.id !== setId)); setContextMenu(null); };

  const moveSetToFolder = (setId: string, targetFolderId: string | null) => {
    onSetsChange(sets.map(s => s.id === setId ? { ...s, folderId: targetFolderId ?? undefined } : s));
    setMovingSetId(null);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, type: "folder" | "set", id: string) => {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ type, id, x: e.clientX, y: e.clientY });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24" onClick={() => setContextMenu(null)}>
      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed z-50 min-w-[160px] rounded-lg border border-border bg-card shadow-lg py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}>
          {contextMenu.type === "folder" ? (
            <>
              <button onClick={() => startRename(contextMenu.id, folders.find(f => f.id === contextMenu.id)?.name || "")}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-foreground">
                <Edit2 className="h-4 w-4" /> Hernoemen
              </button>
              <button onClick={() => { deleteFolder(contextMenu.id); setContextMenu(null); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-red-600">
                <Trash2 className="h-4 w-4" /> Verwijderen
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { onSelectSet(contextMenu.id); setContextMenu(null); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-foreground">
                <BookOpen className="h-4 w-4" /> Openen
              </button>
              <button onClick={() => { setMovingSetId(contextMenu.id); setContextMenu(null); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-foreground">
                <MoveRight className="h-4 w-4" /> Verplaatsen
              </button>
              <button onClick={() => duplicateSet(contextMenu.id)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-foreground">
                <Copy className="h-4 w-4" /> Dupliceren
              </button>
              <button onClick={() => deleteSet(contextMenu.id)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary text-red-600">
                <Trash2 className="h-4 w-4" /> Verwijderen
              </button>
            </>
          )}
        </div>
      )}

      {/* Move set dialog */}
      {movingSetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Verplaats naar map</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button onClick={() => moveSetToFolder(movingSetId, null)}
                className="w-full flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground hover:bg-secondary">
                <Home className="h-4 w-4" /> Geen map (hoofdmap)
              </button>
              {folders.map(f => (
                <button key={f.id} onClick={() => moveSetToFolder(movingSetId, f.id)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground hover:bg-secondary">
                  <Folder className="h-4 w-4" /> {f.name}
                </button>
              ))}
            </div>
            <button onClick={() => setMovingSetId(null)} className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary">Annuleren</button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 pt-8 text-xs text-muted-foreground">
        <button onClick={onBack} className="underline-offset-4 hover:text-foreground hover:underline">
          Overzicht
        </button>
        <span aria-hidden="true">/</span>
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`underline-offset-4 hover:text-foreground hover:underline ${!currentFolderId ? "text-foreground" : ""}`}
        >
          Lijsten
        </button>
        {path.map((f, i) => (
          <span key={f.id} className="flex items-center gap-1">
            <span aria-hidden="true">/</span>
            <button
              onClick={() => setCurrentFolderId(f.id)}
              className={`underline-offset-4 hover:text-foreground hover:underline ${i === path.length - 1 ? "text-foreground" : ""}`}
            >
              {f.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Header */}
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-8">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Bibliotheek
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1]">
            {currentFolderId ? (path[path.length - 1]?.name ?? "Lijsten") : "Lijsten"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {currentFolderId
              ? `${childFolders.length} mappen · ${currentSets.length} studiesets`
              : "Blader door mappen en studiesets. Elk vak heeft een eigen map."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateSet}
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Nieuwe studieset
        </button>
      </section>

      {/* New folder input */}
      {showNewFolder && (
        <form onSubmit={createFolder} className="mt-6 flex gap-2">
          <input
            autoFocus
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="Mapnaam"
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
          />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Aanmaken
          </button>
          <button
            type="button"
            onClick={() => setShowNewFolder(false)}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Annuleer
          </button>
        </form>
      )}

      {/* Explorer content */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowNewFolder(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> Nieuwe map
          </button>
        </div>

        {childFolders.length === 0 && currentSets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-12 text-center">
            <Folder className="mx-auto mb-3 h-10 w-10 opacity-40 text-muted-foreground" />
            <p className="font-display text-lg text-foreground">Deze map is leeg</p>
            <p className="text-sm mt-1 text-muted-foreground">Maak een submap of verplaats studiesets hierheen.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border border-t border-b border-border">
            {childFolders.map(folder => (
              <li key={folder.id} className="group flex items-center gap-3 py-4 hover:bg-secondary/20 transition-colors">
                <FolderOpen className="h-5 w-5 text-amber-500 shrink-0 ml-2" />
                <button
                  className="flex-1 text-left"
                  onDoubleClick={() => setCurrentFolderId(folder.id)}
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  {renamingId === folder.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(folder.id)}
                      onKeyDown={e => {
                        if (e.key === "Enter") commitRename(folder.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="bg-background border border-border rounded px-2 py-0.5 text-sm text-foreground focus:outline-none"
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <p className="text-[15px] font-semibold truncate">{folder.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {folders.filter(f => f.parentId === folder.id).length} mappen ·{" "}
                        {sets.filter(s => s.folderId === folder.id).length} sets
                      </p>
                    </>
                  )}
                </button>
                <button
                  onContextMenu={e => handleContextMenu(e, "folder", folder.id)}
                  onClick={e => {
                    e.stopPropagation();
                    handleContextMenu(e as unknown as React.MouseEvent, "folder", folder.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-muted-foreground hover:bg-secondary mr-2"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </li>
            ))}
            {currentSets.map(set => (
              <li key={set.id} className="group flex items-center gap-3 py-4 hover:bg-secondary/20 transition-colors">
                <ListChecks className="h-5 w-5 text-blue-500 shrink-0 ml-2" />
                <button className="flex-1 text-left" onClick={() => onSelectSet(set.id)}>
                  <p className="text-[15px] font-semibold truncate">{set.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {set.cards.length} kaarten · {accuracy(set)}% nauwkeurig
                  </p>
                </button>
                <button
                  onContextMenu={e => handleContextMenu(e, "set", set.id)}
                  onClick={e => {
                    e.stopPropagation();
                    handleContextMenu(e as unknown as React.MouseEvent, "set", set.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-muted-foreground hover:bg-secondary mr-2"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── FlashcardStudyWorkspace (simple local mode with flip animation) ─────────

function SimpleFlashcard({ cards }: { cards: LocalCard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) return <p className="text-center text-muted-foreground py-8">Geen kaarten.</p>;

  const card = cards[index];
  const total = cards.length;

  const go = (d: number) => {
    setFlipped(false);
    setIndex(i => (i + d + total) % total);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="h-[3px] w-32 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-foreground/70 transition-all"
            style={{ width: `${total ? ((index + 1) / total) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {index + 1} / {total}
        </span>
      </div>

      {/* Flip card */}
      <div
        className="relative w-full cursor-pointer"
        style={{ perspective: "1000px", height: "300px" }}
        onClick={() => setFlipped(f => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setFlipped(f => !f);
          }
        }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-lg border border-border bg-secondary/40 flex flex-col items-center justify-center p-8 shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Term
            </span>
            <MarkdownContent className="font-display text-3xl font-semibold text-center text-foreground leading-snug">
              {card.term}
            </MarkdownContent>
            <span className="mt-4 text-xs text-muted-foreground">Klik om om te draaien</span>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 rounded-lg border border-border bg-secondary flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Definitie
            </span>
            <MarkdownContent className="text-lg text-center text-foreground leading-relaxed">
              {card.definition}
            </MarkdownContent>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            go(-1);
          }}
          className="h-9 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
        >
          Vorige
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            go(1);
          }}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Volgende
        </button>
      </div>
    </div>
  );
}

// ─── StudySetDetailPage ────────────────────────────────────────────────────────

type StudyTab = "flashcards" | "leren" | "schrijven" | "meerkeuze" | "toets";

interface StudySetDetailPageProps {
  set: LocalStudySet;
  onBack: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function StudySetDetailPage({ set, onBack, onDelete, onDuplicate }: StudySetDetailPageProps) {
  const [activeTab, setActiveTab] = useState<StudyTab>("flashcards");
  const [storeReady, setStoreReady] = useState(false);
  const { init, studySet, setActiveMode, refreshPlayableTerms, saveSettingsToStorage, activeMode } = useLearningPlatformStore();

  // Build a StudySet from local cards and init the store
  useEffect(() => {
    const now = new Date();
    const terms = set.cards.map((card, i) => ({
      id: card.id,
      term: card.term,
      definition: card.definition,
      image: card.image,
      front: card.term,
      back: card.definition,
      cardType: "basic" as const,
      tags: [],
      isStarred: card.starred ?? false,
      masteryStatus: "unstudied" as const,
      consecutiveCorrectCount: 0,
      createdAt: now,
      learningSetId: set.id,
      learningSetTitle: set.title,
    }));
    const studySetData = {
      id: set.id,
      title: set.title,
      description: set.description || "",
      terms,
      learningSets: [{ id: set.id, title: set.title, termCount: terms.length }],
      createdAt: now,
      updatedAt: now,
    };
    init(studySetData);
    setStoreReady(false);
    setTimeout(() => {
      refreshPlayableTerms();
      setStoreReady(true);
    }, 80);
    return () => setActiveMode(null);
  }, [set.id]);

  const startMode = (tab: StudyTab) => {
    setActiveTab(tab);
    if (tab === "flashcards") { setActiveMode(null); return; }
    const modeMap: Record<StudyTab, string> = {
      leren: "learn", schrijven: "writing-only", meerkeuze: "multiple-choice-only", toets: "test", flashcards: "flashcard",
    };
    refreshPlayableTerms();
    saveSettingsToStorage();
    setActiveMode(modeMap[tab] as any);
  };

  const tabs: { id: StudyTab; label: string; hint: string }[] = [
    { id: "flashcards", label: "Flashcards", hint: "Omdraaien en herhalen" },
    { id: "leren", label: "Leren", hint: "Geïntegreerde oefenmodus" },
    { id: "meerkeuze", label: "Meerkeuze", hint: "Kies de juiste definitie" },
    { id: "schrijven", label: "Schrijven", hint: "Typ het antwoord" },
    { id: "toets", label: "Toets", hint: "Volledige toets met cijfer" },
  ];

  const masteredCount = studySet?.terms.filter(t => t.masteryStatus === "mastered").length ?? 0;
  const totalTerms = set.cards.length;

  return (
    <div className="mx-auto max-w-4xl px-6 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 pt-8 text-xs text-muted-foreground">
        <button onClick={onBack} className="underline-offset-4 hover:text-foreground hover:underline">
          Lijsten
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-foreground truncate">{set.title}</span>
      </nav>

      {/* Header */}
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-8">
        <div className="max-w-xl min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Studieset
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] truncate">{set.title}</h1>
          {set.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{set.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
            <span>{totalTerms} kaarten</span>
            <span>·</span>
            <span>{masteredCount} beheerst</span>
            <span>·</span>
            <span>{accuracy(set)}% nauwkeurig</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <Copy className="h-3.5 w-3.5" /> Dupliceren
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:hover:bg-red-900"
          >
            <Trash2 className="h-3.5 w-3.5" /> Verwijder
          </button>
        </div>
      </section>

      {/* Mode sidebar + content */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_260px] lg:gap-12">
        <div className="min-w-0">
          <div key={activeTab}>
            {activeTab === "flashcards" && <SimpleFlashcard cards={set.cards} />}
            {activeTab !== "flashcards" && !storeReady && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {activeTab !== "flashcards" && storeReady && activeTab === "leren" && <LearnMode />}
            {activeTab !== "flashcards" && storeReady && activeTab === "meerkeuze" && <McqOnlyMode />}
            {activeTab !== "flashcards" && storeReady && activeTab === "schrijven" && <WritingOnlyMode />}
            {activeTab !== "flashcards" && storeReady && activeTab === "toets" && <TestMode />}
          </div>

          {/* Term list (only for flashcards) */}
          {activeTab === "flashcards" && (
            <div className="mt-12">
              <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3">
                <h2 className="font-display text-2xl font-semibold">Termen</h2>
                <span className="text-xs text-muted-foreground">{set.cards.length} kaarten</span>
              </div>
              <ul className="divide-y divide-border">
                {set.cards.map(card => (
                  <li key={card.id} className="grid gap-1 py-4 sm:grid-cols-[1fr_1.4fr] sm:gap-6">
                    <MarkdownContent className="text-[15px] font-semibold">{card.term}</MarkdownContent>
                    <MarkdownContent className="text-sm leading-relaxed text-muted-foreground">
                      {card.definition}
                    </MarkdownContent>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Oefenmodi sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-4 border-b border-border pb-3 font-display text-lg font-semibold">
            Oefenmodi
          </h2>
          <div className="grid gap-2">
            {tabs.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => startMode(m.id)}
                className={`rounded-md border px-4 py-3 text-left transition-colors ${activeTab === m.id ? "border-foreground bg-secondary" : "border-border hover:border-foreground/40"}`}
              >
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{m.hint}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── PracticeRow ──────────────────────────────────────────────────────────────

function PracticeRow({ title, subtitle, done, total }: { title: string; subtitle: string; done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 text-foreground md:grid-cols-[1.1fr_1fr_220px] md:items-center">
      <span className="font-semibold text-foreground">{title}</span>
      <span className="text-sm text-muted-foreground">{subtitle}</span>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{done} van de {total} onderwerpen geoefend</p>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── SetCard ──────────────────────────────────────────────────────────────────

function SetCard({ set, active, onSelect, onDelete, onDuplicate }: {
  set: LocalStudySet; active: boolean;
  onSelect: () => void; onDelete: () => void; onDuplicate: () => void;
}) {
  return (
    <button type="button" onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${active ? "border-foreground bg-secondary" : "border-border bg-card hover:bg-secondary/50"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-semibold text-foreground truncate">{set.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{set.description || set.source || "Eigen studieset"}</p>
        </div>
        <span className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground shrink-0">{set.cards.length}</span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{accuracy(set)}% nauwkeurig</span>
        <span>·</span>
        <button type="button" onClick={e => { e.stopPropagation(); onDuplicate(); }}
          className="hover:text-foreground flex items-center gap-1"><Copy className="h-3 w-3" /> Kopieer</button>
        <button type="button" onClick={e => { e.stopPropagation(); onDelete(); }}
          className="hover:text-red-600 flex items-center gap-1 ml-auto"><Trash2 className="h-3 w-3" /> Verwijder</button>
      </div>
    </button>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-background p-12 text-center">
      <h2 className="font-display text-2xl font-semibold text-foreground">Maak je eerste studieset</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Voeg kaarten toe en begin met oefenen in verschillende leermodi.
      </p>
      <button onClick={onCreate} className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
        Nieuwe set maken
      </button>
    </div>
  );
}

// ─── Greeting helper ─────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Goedemorgen";
  if (hour >= 12 && hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

// ─── Progress Meter ──────────────────────────────────────────────────────────

function Meter({ value }: { value: number }) {
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-foreground/70 transition-all"
        style={{ width: `${Math.max(value, 2)}%` }}
      />
    </div>
  );
}

type MainScreen =
  | "home"
  | "library"
  | "create"
  | "folders"
  | "lessen"
  | "calendar"
  | "study-detail";

const DEFAULT_PROFILE: UserAccountProfile = {
  username: "", schoolLevel: "VWO", year: 5, schoolProfile: "NT",
  selectedSubjects: PROFILE_RECOMMENDED_SUBJECTS.NT, isOnboarded: false,
};

export function StandaloneLearningPlatform({ sourceSets }: { sourceSets: SourceLearningSet[] }) {
  const [sets, setSets] = useState<LocalStudySet[]>([]);
  const [folders, setFolders] = useState<LocalFolder[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [screen, setScreen] = useState<MainScreen>("home");
  const [userProfile, setUserProfile] = useState<UserAccountProfile>(DEFAULT_PROFILE);
  const [mounted, setMounted] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStreak, setShowStreak] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedSets = loadSets();
    setSets(storedSets);
    const storedFolders = loadFolders();
    setFolders(storedFolders);
    const profile = loadUserProfile();
    setUserProfile(profile);
    if (!profile.isOnboarded) setShowProfileModal(true);
  }, []);

  const persistSets = (next: LocalStudySet[]) => { setSets(next); saveSets(next); };
  const persistFolders = (next: LocalFolder[]) => { setFolders(next); saveFolders(next); };

  const addSet = (set: LocalStudySet) => {
    persistSets([set, ...sets]);
    setSelectedSetId(set.id);
    setScreen("study-detail");
  };

  const deleteSet = (id: string) => {
    persistSets(sets.filter(s => s.id !== id));
    if (selectedSetId === id) { setSelectedSetId(null); setScreen("home"); }
  };

  const duplicateSet = (id: string) => {
    const orig = sets.find(s => s.id === id);
    if (!orig) return;
    const copy: LocalStudySet = { ...orig, id: createId("set"), title: `${orig.title} (kopie)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    persistSets([copy, ...sets]);
  };

  const handleSaveProfile = (p: UserAccountProfile) => { setUserProfile(p); saveUserProfile(p); setShowProfileModal(false); };
  const userInitial = userProfile.username ? userProfile.username[0].toUpperCase() : "A";

  const totalCards = sets.reduce((s, set) => s + set.cards.length, 0);
  const studiedCards = sets.reduce((s, set) => s + set.cards.filter(c => c.attempts > 0).length, 0);
  const streak = mounted ? Number(localStorage.getItem("aether-streak") || "0") : 0;

  // Track streak: if user visits today, bump streak
  useEffect(() => {
    if (!mounted) return;
    const today = new Date().toDateString();
    const last = localStorage.getItem("aether-streak-date");
    if (last !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const cur = Number(localStorage.getItem("aether-streak") || "0");
      const next = last === yesterday ? cur + 1 : 1;
      localStorage.setItem("aether-streak", String(next));
      localStorage.setItem("aether-streak-date", today);
    }
  }, [mounted]);

  const practiceRows = useMemo(() => {
    const subs = selectedSubjectFilter ? [selectedSubjectFilter] : userProfile.selectedSubjects.slice(0, 3);
    return subs.map(sub => {
      const match = sets.find(s => s.title.toLowerCase().includes(sub.split(" ")[0].toLowerCase()) || s.description?.toLowerCase().includes(sub.split(" ")[0].toLowerCase()));
      if (match) return { title: match.title, subtitle: match.source || match.description || sub, done: match.cards.filter(c => c.attempts > 0).length, total: Math.max(1, match.cards.length) };
      return { title: sub, subtitle: `${userProfile.schoolLevel} ${userProfile.year} • ${userProfile.schoolProfile}`, done: 0, total: 5 };
    });
  }, [sets, userProfile, selectedSubjectFilter]);

  const displaySets = useMemo(() => {
    if (!searchQuery.trim()) return sets;
    const q = searchQuery.toLowerCase();
    return sets.filter(s => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
  }, [sets, searchQuery]);

  const selectedSet = sets.find(s => s.id === selectedSetId) ?? null;

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Modals */}
      {showProfileModal && <AccountProfileModal currentProfile={userProfile} onSave={handleSaveProfile} onClose={() => setShowProfileModal(false)} />}
      {showStreak && <StreakModal streak={streak || 1} onClose={() => setShowStreak(false)} />}

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-8 px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            <img src="https://aether-dub5.vercel.app/logo.png" alt="Aether logo" className="h-8 w-8 rounded-md object-contain" />
            <span style={{ fontFamily: 'Cormorant Garamond, serif' }} className="text-2xl font-semibold tracking-tight">Aether</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() => setScreen("home")}
              className={`relative px-4 py-2 text-[15px] font-medium transition-colors ${screen === "home" ? "text-foreground after:absolute after:inset-x-4 after:-bottom-[21px] after:h-px after:bg-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Overzicht
            </button>
            <button
              type="button"
              onClick={() => setScreen("library")}
              className={`relative px-4 py-2 text-[15px] font-medium transition-colors ${screen === "library" || screen === "folders" ? "text-foreground after:absolute after:inset-x-4 after:-bottom-[21px] after:h-px after:bg-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Vakken
            </button>
            <button
              type="button"
              onClick={() => setScreen("calendar")}
              className={`relative px-4 py-2 text-[15px] font-medium transition-colors ${screen === "calendar" ? "text-foreground after:absolute after:inset-x-4 after:-bottom-[21px] after:h-px after:bg-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Kalender
            </button>
            <button
              type="button"
              onClick={() => setScreen("lessen")}
              className={`relative px-4 py-2 text-[15px] font-medium transition-colors ${screen === "lessen" ? "text-foreground after:absolute after:inset-x-4 after:-bottom-[21px] after:h-px after:bg-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Lessen
            </button>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            {/* Search */}
            <label className="hidden h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground lg:flex">
              <Search className="h-4 w-4" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-40 bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
                placeholder="Zoek in sets en lessen"
              />
            </label>
            {/* Streak */}
            {streak > 0 && (
              <button
                type="button"
                onClick={() => setShowStreak(true)}
                className="hidden items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-500 sm:inline-flex"
              >
                {streak} dag streak
              </button>
            )}
            {/* Avatar */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              title="Account & Profiel"
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-sm font-medium"
            >
              {userInitial}
            </button>
          </div>
        </div>
      </header>

      {/* ── Screen router ── */}
      {screen === "create" && (
        <CreateSetPage
          onSave={set => { addSet(set); }}
          onCancel={() => setScreen("home")}
        />
      )}

      {screen === "folders" && (
        <FolderExplorer
          folders={folders}
          sets={sets}
          onFoldersChange={persistFolders}
          onSetsChange={persistSets}
          onSelectSet={id => { setSelectedSetId(id); setScreen("study-detail"); }}
          onBack={() => setScreen("home")}
          onCreateSet={() => setScreen("create")}
          userSubjects={userProfile.selectedSubjects}
        />
      )}

      {screen === "lessen" && <LessenPage onBack={() => setScreen("home")} />}

      {screen === "calendar" && <CalendarPage onBack={() => setScreen("home")} />}

      {screen === "study-detail" && selectedSet && (
        <StudySetDetailPage
          set={selectedSet}
          onBack={() => setScreen("library")}
          onDelete={() => { deleteSet(selectedSet.id); setScreen("library"); }}
          onDuplicate={() => { duplicateSet(selectedSet.id); }}
        />
      )}

      {screen === "study-detail" && !selectedSet && (
        <div className="mx-auto max-w-7xl px-5 py-12 text-center">
          <p className="text-muted-foreground">Set niet gevonden.</p>
          <button onClick={() => setScreen("home")} className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background">Terug naar home</button>
        </div>
      )}

      {screen === "library" && (
        <FolderExplorer
          folders={folders}
          sets={sets}
          onFoldersChange={persistFolders}
          onSetsChange={persistSets}
          onSelectSet={id => { setSelectedSetId(id); setScreen("study-detail"); }}
          onBack={() => setScreen("home")}
          onCreateSet={() => setScreen("create")}
          userSubjects={userProfile.selectedSubjects}
        />
      )}

      {screen === "home" && (
        <div className="mx-auto max-w-[1400px] space-y-12 px-8 pb-24">

          {/* Welcome banner */}
          <section className="grid gap-10 border-b border-border py-16">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {userProfile.schoolLevel} {userProfile.year} · {userProfile.schoolProfile} · {userProfile.selectedSubjects.length} VAKKEN
              </p>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif' }} className="mt-4 text-7xl font-semibold leading-[1.05]">
                {getGreeting()}, {userProfile.username || "Mohammed"}
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Je hebt {sets.reduce((sum, s) => sum + s.cards.filter(c => c.attempts === 0).length, 0)} kaarten klaarstaan om te herhalen. Begin bij{" "}
                {sets.length > 0 ? sets[0].title : "je eerste set"}—daar loopt je beheersing het meest achter.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => { if (sets.length > 0) { setSelectedSetId(sets[0].id); setScreen("study-detail"); } else setScreen("create"); }}
                  className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {sets.length > 0 ? "Start oefensessie" : "Maak eerste set"}
                </button>
                <button
                  type="button"
                  onClick={() => setScreen("library")}
                  className="inline-flex h-11 items-center rounded-md border border-border px-6 text-[15px] font-medium transition-colors hover:bg-secondary"
                >
                  Bekijk vakken
                </button>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-10">
              <div className="flex flex-col gap-1">
                <span style={{ fontFamily: 'Cormorant Garamond, serif' }} className="text-5xl font-semibold leading-none">{sets.length}</span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">SETS</span>
              </div>
              <div className="flex flex-col gap-1">
                <span style={{ fontFamily: 'Cormorant Garamond, serif' }} className="text-5xl font-semibold leading-none">{userProfile.selectedSubjects.length}</span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">VAKKEN</span>
              </div>
              <div className="flex flex-col gap-1">
                <span style={{ fontFamily: 'Cormorant Garamond, serif' }} className="text-5xl font-semibold leading-none">{sets.reduce((sum, s) => sum + s.cards.filter(c => c.attempts === 0).length, 0)}</span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">TE HERHALEN</span>
              </div>
            </dl>
          </section>

          {/* Subject filter pills */}
          <div className="flex flex-wrap items-center gap-2 py-4">
            <span className="mr-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">VAK</span>
            <button
              type="button"
              onClick={() => setSelectedSubjectFilter(null)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${!selectedSubjectFilter ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
            >
              Alle vakken
            </button>
            {userProfile.selectedSubjects.map(sub => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubjectFilter(sub === selectedSubjectFilter ? null : sub)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${selectedSubjectFilter === sub ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Progress per subject */}
          <div className="grid gap-14 lg:grid-cols-[1fr_380px]">
            <div className="min-w-0">
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-4">
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif' }} className="text-3xl font-semibold">Voortgang per vak</h2>
                <span className="text-sm text-muted-foreground">
                  {selectedSubjectFilter ? "1 vak" : `${userProfile.selectedSubjects.length} vakken`}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {practiceRows.map(row => (
                  <li
                    key={row.title}
                    className="grid grid-cols-[1fr_auto] items-center gap-6 py-6 sm:grid-cols-[1.4fr_1fr_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[17px] font-semibold">{row.title}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">{row.subtitle}</p>
                    </div>
                    <div className="hidden sm:block">
                      <div className="mb-2 flex items-baseline justify-between text-[13px] text-muted-foreground">
                        <span>
                          {row.done} van {row.total} onderwerpen
                        </span>
                        <span className="tabular-nums">{Math.round((row.done / Math.max(row.total, 1)) * 100)}%</span>
                      </div>
                      <Meter value={Math.round((row.done / Math.max(row.total, 1)) * 100)} />
                    </div>
                    <div className="flex items-center justify-end gap-4">
                      {row.done === row.total ? (
                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">
                          Bij
                        </span>
                      ) : (
                        <span className="text-[13px] tabular-nums text-muted-foreground">{row.total - row.done} te doen</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setScreen("library")}
                        className="inline-flex h-9 items-center rounded-md border border-border px-4 text-[13px] font-medium transition-colors hover:bg-secondary"
                      >
                        Openen
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
              <div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif' }} className="mb-5 border-b border-border pb-4 text-2xl font-semibold">
                  Deze week
                </h2>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-secondary/20 p-5">
                    <p className="text-[13px] font-semibold">SO Scheikunde — zuren & basen</p>
                    <p className="mt-1 text-xs text-muted-foreground">maandag 3 augustus · 09:15</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/20 p-5">
                    <p className="text-[13px] font-semibold">Practicum titraties</p>
                    <p className="mt-1 text-xs text-muted-foreground">dinsdag 4 augustus · 11:00</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/20 p-5">
                    <p className="text-[13px] font-semibold">Inleveren essay literatuur</p>
                    <p className="mt-1 text-xs text-muted-foreground">donderdag 6 augustus · 23:59</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen("calendar")}
                  className="mt-5 text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Kalender
                </button>
              </div>

              <div className="rounded-lg border border-border p-6">
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif' }} className="text-xl font-semibold">Maak iets nieuws</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  Zet aantekeningen om in een studieset en oefen er direct mee.
                </p>
                <button
                  type="button"
                  onClick={() => setScreen("create")}
                  className="mt-5 h-10 w-full rounded-md bg-primary text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Nieuwe studieset
                </button>
              </div>
            </aside>
          </div>

          {/* Recent sets */}
          {sets.length > 0 && (
            <section className="mt-14">
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-4">
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif' }} className="text-3xl font-semibold">Recente studiesets</h2>
                <button type="button" onClick={() => setScreen("library")} className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  Alle sets
                </button>
              </div>
              <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                {sets.slice(0, 6).map(set => (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => { setSelectedSetId(set.id); setScreen("study-detail"); }}
                    className="bg-background p-8 transition-colors hover:bg-secondary/50 text-left"
                  >
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {set.source || "Eigen set"}
                    </p>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif' }} className="mt-3 text-3xl font-semibold truncate">{set.title}</h3>
                    <p className="mt-2 text-[13px] text-muted-foreground">
                      {set.cards.length} kaarten · {accuracy(set)}% nauwkeurig
                    </p>
                    {set.description && (
                      <p className="mt-4 text-[13px] text-muted-foreground line-clamp-2">{set.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {sets.length === 0 && (
            <EmptyState onCreate={() => setScreen("create")} />
          )}
        </div>
      )}
    </main>
  );
}

