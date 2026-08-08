/* Static demo content for the Aether platform. */

export type Card = { term: string; definition: string };

export type TreeNode = {
  slug: string;
  name: string;
  description?: string;
  kind: 'folder' | 'set';
  children?: TreeNode[];
  cards?: Card[];
};

export type Subject = {
  slug: string;
  name: string;
  level: string;
  topicsDone: number;
  topics: number;
  sets: number;
  due: number;
  mastery: number;
  teacher: string;
  children: TreeNode[];
};

function cards(pairs: [string, string][]): Card[] {
  return pairs.map(([term, definition]) => ({ term, definition }));
}

export const SUBJECTS: Subject[] = [
  {
    slug: 'nederlands',
    name: 'Nederlands',
    level: 'VWO 4 · NT',
    topicsDone: 2,
    topics: 5,
    sets: 3,
    due: 12,
    mastery: 41,
    teacher: 'mw. De Vries',
    children: [
      {
        slug: 'taalvaardigheid',
        name: 'Taalvaardigheid',
        kind: 'folder',
        description: 'Argumentatie, stijl en tekstopbouw',
        children: [
          {
            slug: 'stijlfiguren',
            name: 'Stijlfiguren & argumentatie',
            kind: 'set',
            description: 'Retorische middelen en drogredenen',
            cards: cards([
              [
                'Metafoor',
                "Beeldspraak waarbij iets wordt vervangen door iets anders zonder 'als'.",
              ],
              ['Eufemisme', 'Een verzachtende uitdrukking voor iets onaangenaams.'],
              ['Pleonasme', 'Overbodige toevoeging van een eigenschap die al in het woord zit.'],
            ]),
          },
        ],
      },
    ],
  },
  {
    slug: 'engels',
    name: 'Engels',
    level: 'VWO 4 · NT',
    topicsDone: 4,
    topics: 5,
    sets: 4,
    due: 6,
    mastery: 78,
    teacher: 'dhr. Bakker',
    children: [
      {
        slug: 'grammar',
        name: 'Grammar',
        kind: 'folder',
        description: 'Werkwoordstijden en zinsbouw',
        children: [
          {
            slug: 'irregular-verbs',
            name: 'Irregular verbs — part II',
            kind: 'set',
            description: 'Onregelmatige werkwoorden M–Z',
            cards: cards([
              ['to make', 'made — made'],
              ['to know', 'knew — known'],
              ['to write', 'wrote — written'],
            ]),
          },
        ],
      },
    ],
  },
  {
    slug: 'natuurkunde',
    name: 'Natuurkunde',
    level: 'VWO 4 · NT',
    topicsDone: 1,
    topics: 5,
    sets: 2,
    due: 21,
    mastery: 24,
    teacher: 'dhr. Jansen',
    children: [
      {
        slug: 'mechanica',
        name: 'Mechanica',
        kind: 'folder',
        description: 'Kracht, arbeid en energie',
        children: [
          {
            slug: 'arbeid-energie',
            name: 'Kracht, arbeid en energie',
            kind: 'set',
            description: 'Formules en begrippen hoofdstuk 4',
            cards: cards([
              ['Arbeid (W)', 'W = F · s · cos α, uitgedrukt in joule.'],
              ['Kinetische energie', 'E_k = ½ · m · v²'],
            ]),
          },
        ],
      },
    ],
  },
  {
    slug: 'scheikunde',
    name: 'Scheikunde',
    level: 'VWO 4 · NT',
    topicsDone: 3,
    topics: 6,
    sets: 3,
    due: 9,
    mastery: 55,
    teacher: 'mw. El Amrani',
    children: [],
  },
  {
    slug: 'wiskunde-b',
    name: 'Wiskunde B',
    level: 'VWO 4 · NT',
    topicsDone: 0,
    topics: 6,
    sets: 2,
    due: 30,
    mastery: 8,
    teacher: 'dhr. Smit',
    children: [],
  },
  {
    slug: 'biologie',
    name: 'Biologie',
    level: 'VWO 4 · NT',
    topicsDone: 5,
    topics: 5,
    sets: 5,
    due: 0,
    mastery: 93,
    teacher: 'mw. Peters',
    children: [],
  },
];

export function findSubject(slug: string) {
  return SUBJECTS.find((s) => s.slug === slug);
}

export function resolvePath(segments: string[]): {
  subject?: Subject | undefined;
  trail: TreeNode[];
  node?: TreeNode | undefined;
} {
  const [subjectSlug, ...rest] = segments;
  const subject = findSubject(subjectSlug ?? '');
  const trail: TreeNode[] = [];
  if (!subject) return { trail };
  let level = subject.children;
  let node: TreeNode | undefined;
  for (const seg of rest) {
    const found = level?.find((n) => n.slug === seg);
    if (!found) return { subject, trail, node: undefined };
    trail.push(found);
    node = found;
    level = found.children ?? [];
  }
  return { subject, trail, node };
}

export function countSets(nodes: TreeNode[] = []): number {
  return nodes.reduce((a, n) => a + (n.kind === 'set' ? 1 : countSets(n.children ?? [])), 0);
}

/* -------------------------------- lessons -------------------------------- */

export const LESSONS = [
  { title: "Argumentatieschema's ontleden", subject: 'Nederlands', minutes: 18, level: 'Basis' },
  { title: 'Formeel schrijven zonder clichés', subject: 'Engels', minutes: 22, level: 'Gevorderd' },
  {
    title: 'Energiebehoud in bewegende systemen',
    subject: 'Natuurkunde',
    minutes: 26,
    level: 'Gevorderd',
  },
  { title: 'Titraties stap voor stap', subject: 'Scheikunde', minutes: 15, level: 'Basis' },
  { title: 'Kettingregel in de praktijk', subject: 'Wiskunde B', minutes: 20, level: 'Gevorderd' },
  { title: 'Van gen naar eiwit', subject: 'Biologie', minutes: 17, level: 'Basis' },
];

export const GROUPS = [
  { name: '4V Nederlands — klas A', members: 28, activity: '3 nieuwe sets deze week' },
  { name: 'Examentraining Wiskunde B', members: 14, activity: 'Toets gepland op 12 juni' },
  { name: 'Bio-studiegroep', members: 9, activity: 'Laatste activiteit: gisteren' },
];

/* ------------------------------- calendar -------------------------------- */

export type EventType = 'toets' | 'examen' | 'les' | 'deadline' | 'vakantie' | 'activiteit';

export type SchoolEvent = {
  date: string; // YYYY-MM-DD
  end?: string;
  title: string;
  subject?: string;
  type: EventType;
  time?: string;
  location?: string;
};

export const EVENT_LABELS: Record<EventType, string> = {
  toets: 'Toets',
  examen: 'Examen',
  les: 'Les',
  deadline: 'Deadline',
  vakantie: 'Vakantie',
  activiteit: 'Activiteit',
};

export const SCHOOL_EVENTS: SchoolEvent[] = [
  {
    date: '2026-08-03',
    title: 'SO Scheikunde — zuren & basen',
    subject: 'Scheikunde',
    type: 'toets',
    time: '09:15',
    location: 'Lokaal 2.14',
  },
  {
    date: '2026-08-04',
    title: 'Practicum titraties',
    subject: 'Scheikunde',
    type: 'les',
    time: '11:00',
    location: 'Lab B',
  },
  {
    date: '2026-08-06',
    title: 'Inleveren essay literatuur',
    subject: 'Nederlands',
    type: 'deadline',
    time: '23:59',
  },
  {
    date: '2026-08-07',
    title: 'Repetitie Wiskunde B — hoofdstuk 4',
    subject: 'Wiskunde B',
    type: 'toets',
    time: '08:30',
    location: 'Aula',
  },
  {
    date: '2026-08-10',
    title: 'Presentatie Engels',
    subject: 'Engels',
    type: 'activiteit',
    time: '13:20',
    location: 'Lokaal 1.05',
  },
  {
    date: '2026-08-12',
    title: 'Proefwerkweek start',
    type: 'examen',
    time: '08:00',
    location: 'Sportzaal',
  },
  {
    date: '2026-08-13',
    title: 'Examen Natuurkunde',
    subject: 'Natuurkunde',
    type: 'examen',
    time: '09:00',
    location: 'Sportzaal',
  },
  {
    date: '2026-08-14',
    title: 'Examen Biologie',
    subject: 'Biologie',
    type: 'examen',
    time: '13:00',
    location: 'Sportzaal',
  },
  {
    date: '2026-08-17',
    title: 'Excursie Rijksmuseum',
    subject: 'Nederlands',
    type: 'activiteit',
    time: '10:00',
  },
  { date: '2026-08-21', title: 'Rapportvergadering — lesvrij', type: 'vakantie' },
  { date: '2026-08-24', end: '2026-08-28', title: 'Herfstvakantie', type: 'vakantie' },
];

export const AGENDA_TONES: Record<EventType, string> = {
  toets: 'tint-warning',
  examen: 'tint-warning',
  deadline: 'tint-streak',
  les: 'bg-secondary text-muted-foreground',
  vakantie: 'tint-success',
  activiteit: 'bg-secondary text-muted-foreground',
};
