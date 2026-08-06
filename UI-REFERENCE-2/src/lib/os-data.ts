/* Static demo content for the Aether Student OS. Everything here is simulated. */

/* --------------------------------- grades -------------------------------- */

export type Grade = {
  id: string;
  name: string;
  type: "SO" | "PW" | "PO" | "Mondeling" | "Praktisch";
  date: string;
  weight: number;
  grade: number | null;
  period: 1 | 2 | 3 | 4;
};

export type SubjectGrades = {
  slug: string;
  name: string;
  teacher: string;
  target: number;
  grades: Grade[];
};

const g = (
  id: string,
  name: string,
  type: Grade["type"],
  date: string,
  weight: number,
  grade: number | null,
  period: Grade["period"] = 1,
): Grade => ({ id, name, type, date, weight, grade, period });

export const GRADEBOOK: SubjectGrades[] = [
  {
    slug: "nederlands",
    name: "Nederlands",
    teacher: "mw. De Vries",
    target: 7.5,
    grades: [
      g("nl1", "SO stijlfiguren", "SO", "2026-09-12", 1, 6.8),
      g("nl2", "Betoog schrijven", "PO", "2026-10-03", 2, 7.4),
      g("nl3", "PW literatuurgeschiedenis", "PW", "2026-11-18", 3, 5.9, 2),
      g("nl4", "Mondeling boekverslag", "Mondeling", "2026-12-09", 2, 7.1, 2),
      g("nl5", "PW tekstverbanden", "PW", "2027-01-22", 3, null, 3),
    ],
  },
  {
    slug: "engels",
    name: "Engels",
    teacher: "dhr. Bakker",
    target: 8,
    grades: [
      g("en1", "SO irregular verbs", "SO", "2026-09-05", 1, 8.4),
      g("en2", "Reading comprehension", "PW", "2026-10-11", 3, 7.9),
      g("en3", "Presentation", "PO", "2026-11-24", 2, 8.6, 2),
      g("en4", "Writing essay", "PW", "2026-12-15", 3, 7.2, 2),
      g("en5", "Listening test", "PW", "2027-02-04", 2, null, 3),
    ],
  },
  {
    slug: "natuurkunde",
    name: "Natuurkunde",
    teacher: "dhr. Jansen",
    target: 7,
    grades: [
      g("na1", "SO krachten", "SO", "2026-09-19", 1, 5.2),
      g("na2", "PW mechanica", "PW", "2026-10-24", 3, 6.1),
      g("na3", "Practicum verslag", "Praktisch", "2026-11-30", 2, 7.0, 2),
      g("na4", "PW energie & arbeid", "PW", "2027-01-15", 3, 5.8, 3),
      g("na5", "PW elektriciteit", "PW", "2027-03-06", 3, null, 3),
    ],
  },
  {
    slug: "scheikunde",
    name: "Scheikunde",
    teacher: "mw. Willems",
    target: 7,
    grades: [
      g("sk1", "SO zuren & basen", "SO", "2026-09-26", 1, 6.4),
      g("sk2", "Practicum titraties", "Praktisch", "2026-10-30", 2, 7.8),
      g("sk3", "PW reactievergelijkingen", "PW", "2026-12-04", 3, 6.6, 2),
      g("sk4", "PW rekenen aan reacties", "PW", "2027-02-12", 3, null, 3),
    ],
  },
  {
    slug: "wiskunde-b",
    name: "Wiskunde B",
    teacher: "dhr. Smit",
    target: 6.5,
    grades: [
      g("wi1", "SO functies", "SO", "2026-09-08", 1, 4.8),
      g("wi2", "PW differentiëren", "PW", "2026-10-17", 3, 5.4),
      g("wi3", "Herkansing differentiëren", "PW", "2026-11-07", 3, 6.2, 2),
      g("wi4", "PW goniometrie", "PW", "2027-01-29", 3, null, 3),
    ],
  },
  {
    slug: "biologie",
    name: "Biologie",
    teacher: "mw. Peters",
    target: 8.5,
    grades: [
      g("bi1", "SO celbiologie", "SO", "2026-09-15", 1, 9.1),
      g("bi2", "PW genetica", "PW", "2026-10-22", 3, 8.7),
      g("bi3", "Praktische opdracht ecologie", "PO", "2026-12-01", 2, 9.4, 2),
      g("bi4", "PW erfelijkheid", "PW", "2027-02-19", 3, null, 3),
    ],
  },
];

export function averageOf(grades: Grade[]): number | null {
  const scored = grades.filter((x) => x.grade !== null);
  if (!scored.length) return null;
  const w = scored.reduce((a, x) => a + x.weight, 0);
  return scored.reduce((a, x) => a + (x.grade as number) * x.weight, 0) / w;
}

export const OVERALL_AVERAGE = (() => {
  const values = GRADEBOOK.map((s) => averageOf(s.grades)).filter((v): v is number => v !== null);
  return values.reduce((a, v) => a + v, 0) / values.length;
})();

/* --------------------------------- tasks --------------------------------- */

export type Task = {
  id: string;
  title: string;
  subject: string;
  due: string;
  status: "todo" | "bezig" | "review" | "klaar";
  priority: "laag" | "normaal" | "hoog";
  estimate: string;
  tags: string[];
};

export const TASKS: Task[] = [
  { id: "t1", title: "Samenvatting hoofdstuk 4 maken", subject: "Wiskunde B", due: "2026-08-05", status: "bezig", priority: "hoog", estimate: "1u 30m", tags: ["samenvatting"] },
  { id: "t2", title: "Essay literatuur afronden", subject: "Nederlands", due: "2026-08-06", status: "review", priority: "hoog", estimate: "45m", tags: ["schrijven", "deadline"] },
  { id: "t3", title: "Irregular verbs oefenen", subject: "Engels", due: "2026-08-07", status: "todo", priority: "normaal", estimate: "20m", tags: ["woordjes"] },
  { id: "t4", title: "Practicumverslag titraties", subject: "Scheikunde", due: "2026-08-09", status: "todo", priority: "normaal", estimate: "1u", tags: ["lab"] },
  { id: "t5", title: "Oefentoets mechanica", subject: "Natuurkunde", due: "2026-08-11", status: "todo", priority: "hoog", estimate: "2u", tags: ["toets"] },
  { id: "t6", title: "Genetica kaarten herhalen", subject: "Biologie", due: "2026-08-04", status: "klaar", priority: "laag", estimate: "15m", tags: ["flashcards"] },
  { id: "t7", title: "Aantekeningen digitaliseren", subject: "Nederlands", due: "2026-08-12", status: "todo", priority: "laag", estimate: "30m", tags: ["notities"] },
  { id: "t8", title: "Formulekaart printen", subject: "Wiskunde B", due: "2026-08-08", status: "klaar", priority: "laag", estimate: "5m", tags: ["voorbereiding"] },
  { id: "t9", title: "Presentatie slides ontwerpen", subject: "Engels", due: "2026-08-10", status: "bezig", priority: "normaal", estimate: "1u 15m", tags: ["presentatie"] },
];

export const TASK_COLUMNS: Task["status"][] = ["todo", "bezig", "review", "klaar"];
export const TASK_LABELS: Record<Task["status"], string> = {
  todo: "Te doen",
  bezig: "Bezig",
  review: "Nakijken",
  klaar: "Klaar",
};

/* --------------------------------- notes ---------------------------------- */

export type NotePage = {
  slug: string;
  title: string;
  icon: string;
  updated: string;
  words: number;
  tags: string[];
  children?: NotePage[];
  excerpt?: string;
};

export const NOTE_TREE: NotePage[] = [
  {
    slug: "schooljaar",
    title: "Schooljaar 2026/2027",
    icon: "◆",
    updated: "vandaag",
    words: 320,
    tags: ["wiki"],
    excerpt: "Overkoepelende werkruimte met alle vakken, periodes en afspraken.",
    children: [
      {
        slug: "wiskunde-b",
        title: "Wiskunde B",
        icon: "∑",
        updated: "2 uur geleden",
        words: 1840,
        tags: ["vak"],
        excerpt: "Differentiëren, goniometrie en formulebladen.",
        children: [
          { slug: "differentieren", title: "Differentiëren", icon: "→", updated: "gisteren", words: 720, tags: ["theorie"], excerpt: "Machtsregel, productregel, quotiëntregel en kettingregel met uitgewerkte voorbeelden." },
          { slug: "formulekaart", title: "Formulekaart", icon: "▤", updated: "3 dagen geleden", words: 240, tags: ["naslag"], excerpt: "Alle formules die je op de toets mag gebruiken." },
        ],
      },
      {
        slug: "nederlands",
        title: "Nederlands",
        icon: "¶",
        updated: "gisteren",
        words: 1260,
        tags: ["vak"],
        excerpt: "Literatuurgeschiedenis, argumentatie en schrijfopdrachten.",
        children: [
          { slug: "essay", title: "Essay — leesdossier", icon: "✎", updated: "vandaag", words: 980, tags: ["opdracht", "deadline"], excerpt: "Werkversie van het essay over de moderne roman." },
        ],
      },
      { slug: "planning", title: "Periodeplanning", icon: "▦", updated: "4 dagen geleden", words: 410, tags: ["planning"], excerpt: "Weekindeling per periode met toetsmomenten." },
    ],
  },
  {
    slug: "sjablonen",
    title: "Sjablonen",
    icon: "▧",
    updated: "vorige week",
    words: 150,
    tags: ["templates"],
    excerpt: "Herbruikbare pagina's voor samenvattingen, toetsplanning en verslagen.",
    children: [
      { slug: "samenvatting", title: "Sjabloon — samenvatting", icon: "▤", updated: "vorige week", words: 90, tags: ["template"] },
      { slug: "toetsplan", title: "Sjabloon — toetsplan", icon: "◷", updated: "vorige week", words: 60, tags: ["template"] },
    ],
  },
];

export const SLASH_COMMANDS = [
  { label: "Tekst", hint: "Gewone alinea", key: "text" },
  { label: "Kop 1", hint: "Grote sectiekop", key: "h1" },
  { label: "Kop 2", hint: "Middelgrote kop", key: "h2" },
  { label: "Opsomming", hint: "Ongeordende lijst", key: "ul" },
  { label: "Genummerd", hint: "Geordende lijst", key: "ol" },
  { label: "To-do", hint: "Checklist met vinkjes", key: "todo" },
  { label: "Tabel", hint: "Database met kolommen", key: "table" },
  { label: "Kanban", hint: "Bord met kolommen", key: "board" },
  { label: "Citaat", hint: "Blok met citaat", key: "quote" },
  { label: "Formule", hint: "Wiskundige notatie", key: "math" },
  { label: "Scheiding", hint: "Horizontale lijn", key: "divider" },
  { label: "Studieset", hint: "Koppel een set aan deze pagina", key: "set" },
];

/* --------------------------------- decks ---------------------------------- */

export type Deck = {
  slug: string;
  name: string;
  new: number;
  learn: number;
  due: number;
  children?: Deck[];
};

export const DECKS: Deck[] = [
  {
    slug: "vwo4",
    name: "VWO 4",
    new: 42,
    learn: 11,
    due: 63,
    children: [
      {
        slug: "exact",
        name: "Exacte vakken",
        new: 28,
        learn: 7,
        due: 44,
        children: [
          { slug: "wiskunde-b", name: "Wiskunde B", new: 16, learn: 4, due: 30 },
          { slug: "natuurkunde", name: "Natuurkunde", new: 8, learn: 2, due: 9 },
          { slug: "scheikunde", name: "Scheikunde", new: 4, learn: 1, due: 5 },
        ],
      },
      {
        slug: "talen",
        name: "Talen",
        new: 14,
        learn: 4,
        due: 19,
        children: [
          { slug: "engels", name: "Engels", new: 6, learn: 2, due: 6 },
          { slug: "nederlands", name: "Nederlands", new: 8, learn: 2, due: 13 },
        ],
      },
    ],
  },
  { slug: "biologie", name: "Biologie", new: 0, learn: 0, due: 0 },
];

export type BrowserCard = {
  id: string;
  front: string;
  back: string;
  deck: string;
  tags: string[];
  interval: string;
  ease: string;
  due: string;
  state: "nieuw" | "leren" | "herhalen" | "uitgesteld";
};

export const CARD_BROWSER: BrowserCard[] = [
  { id: "c1", front: "Kettingregel", back: "f(g(x))' = f'(g(x))·g'(x)", deck: "VWO 4::Wiskunde B", tags: ["afgeleide"], interval: "4d", ease: "2.35", due: "morgen", state: "herhalen" },
  { id: "c2", front: "sin(30°)", back: "½", deck: "VWO 4::Wiskunde B", tags: ["gonio"], interval: "12d", ease: "2.60", due: "over 4 dagen", state: "herhalen" },
  { id: "c3", front: "to rise", back: "rose — risen", deck: "VWO 4::Engels", tags: ["irregular"], interval: "1d", ease: "2.10", due: "vandaag", state: "leren" },
  { id: "c4", front: "Mitose", back: "Celdeling met twee identieke dochtercellen", deck: "Biologie", tags: ["genetica"], interval: "31d", ease: "2.80", due: "over 3 weken", state: "herhalen" },
  { id: "c5", front: "Arbeid", back: "W = F · s · cos α", deck: "VWO 4::Natuurkunde", tags: ["mechanica", "formule"], interval: "—", ease: "—", due: "nieuw", state: "nieuw" },
  { id: "c6", front: "Eufemisme", back: "Verzachtende uitdrukking", deck: "VWO 4::Nederlands", tags: ["stijlfiguur"], interval: "2d", ease: "2.20", due: "vandaag", state: "leren" },
  { id: "c7", front: "Redoxreactie", back: "Reactie met elektronenoverdracht", deck: "VWO 4::Scheikunde", tags: ["reacties"], interval: "8d", ease: "2.45", due: "over 6 dagen", state: "uitgesteld" },
  { id: "c8", front: "Quotiëntregel", back: "(u/v)' = (u'v − uv')/v²", deck: "VWO 4::Wiskunde B", tags: ["afgeleide"], interval: "—", ease: "—", due: "nieuw", state: "nieuw" },
];

export const CARD_TAGS = [
  { tag: "afgeleide", count: 24 },
  { tag: "gonio", count: 18 },
  { tag: "irregular", count: 42 },
  { tag: "genetica", count: 31 },
  { tag: "mechanica", count: 27 },
  { tag: "formule", count: 16 },
  { tag: "stijlfiguur", count: 12 },
  { tag: "reacties", count: 9 },
];

/* -------------------------------- analytics ------------------------------- */

export const HEATMAP: number[] = Array.from({ length: 182 }, (_, i) => {
  const v = (Math.sin(i / 5) + Math.cos(i / 3.3) + 2) / 4;
  return i % 17 === 0 ? 0 : Math.round(v * 4);
});

export const REVIEW_FORECAST = [18, 24, 31, 12, 27, 9, 14, 22, 30, 17, 11, 25, 19, 8];
export const RETENTION_SERIES = [72, 74, 71, 78, 81, 79, 84, 86, 83, 88, 90, 87];
export const MINUTES_PER_DAY = [24, 41, 12, 55, 33, 68, 19];
export const SESSION_MIX = [
  { label: "Flashcards", value: 38 },
  { label: "Leren", value: 24 },
  { label: "Toets", value: 16 },
  { label: "Schrijven", value: 12 },
  { label: "Match", value: 10 },
];

export const ACHIEVEMENTS = [
  { name: "Eerste set", description: "Maak je eerste studieset", earned: true },
  { name: "Weekstreak", description: "7 dagen achter elkaar geoefend", earned: true },
  { name: "Foutloos", description: "Rond een toetsmodus zonder fouten af", earned: true },
  { name: "Nachtbraker", description: "Studeer na middernacht", earned: true },
  { name: "Marathon", description: "60 minuten in één sessie", earned: false },
  { name: "Meester", description: "100% beheersing op een vak", earned: false },
  { name: "Deeler", description: "Deel een set met je klas", earned: false },
  { name: "Verzamelaar", description: "1.000 kaarten beoordeeld", earned: false },
];

export const NOTIFICATIONS = [
  { title: "Essay literatuur", body: "Deadline over 3 dagen — status: nakijken", time: "10 min", unread: true },
  { title: "Nieuwe set gedeeld", body: "4V Nederlands — klas A deelde 'Tekstverbanden'", time: "1 uur", unread: true },
  { title: "Herhaling klaar", body: "63 kaarten staan klaar in VWO 4", time: "3 uur", unread: true },
  { title: "Cijfer toegevoegd", body: "Natuurkunde — PW energie & arbeid: 5,8", time: "gisteren", unread: false },
  { title: "Rooster gewijzigd", body: "Scheikunde verplaatst naar lokaal 2.14", time: "2 dagen", unread: false },
];

export const ONBOARDING = [
  { label: "Profiel invullen", done: true },
  { label: "Vakken kiezen", done: true },
  { label: "Eerste studieset maken", done: true },
  { label: "Agenda koppelen aan rooster", done: false },
  { label: "Klas of groep toevoegen", done: false },
];

/* ------------------------------ agenda extras ----------------------------- */

export type Reminder = { title: string; time: string; subject?: string; repeat?: string };

export const REMINDERS: Reminder[] = [
  { title: "Herhaalsessie Wiskunde B", time: "07:45", subject: "Wiskunde B", repeat: "Elke werkdag" },
  { title: "Woordjes Engels", time: "16:30", subject: "Engels", repeat: "Ma, wo, vr" },
  { title: "Weekplanning maken", time: "19:00", repeat: "Elke zondag" },
];

export const TIMETABLE = [
  { period: "1", time: "08:30", subject: "Wiskunde B", room: "3.02", teacher: "dhr. Smit" },
  { period: "2", time: "09:20", subject: "Nederlands", room: "1.14", teacher: "mw. De Vries" },
  { period: "3", time: "10:30", subject: "Scheikunde", room: "2.14", teacher: "mw. Willems" },
  { period: "4", time: "11:20", subject: "Engels", room: "1.05", teacher: "dhr. Bakker" },
  { period: "5", time: "12:40", subject: "Natuurkunde", room: "2.08", teacher: "dhr. Jansen" },
  { period: "6", time: "13:30", subject: "Biologie", room: "2.21", teacher: "mw. Peters" },
  { period: "7", time: "14:20", subject: "Mentoruur", room: "1.14", teacher: "mw. De Vries" },
];

export const ABSENCES = [
  { date: "2026-07-14", type: "Te laat", subject: "Wiskunde B", note: "5 minuten" },
  { date: "2026-06-29", type: "Ziek", subject: "Hele dag", note: "Gemeld door ouder" },
  { date: "2026-06-11", type: "Geoorloofd", subject: "Biologie", note: "Tandarts" },
];
