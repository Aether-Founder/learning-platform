/* Static demo content for the Aether Student OS. Everything here is simulated. */

/* --------------------------------- grades -------------------------------- */

export type Grade = {
  id: string;
  name: string;
  type: 'SO' | 'PW' | 'PO' | 'Mondeling' | 'Praktisch';
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
  type: Grade['type'],
  date: string,
  weight: number,
  grade: number | null,
  period: Grade['period'] = 1
): Grade => ({ id, name, type, date, weight, grade, period });

export const GRADEBOOK: SubjectGrades[] = [
  {
    slug: 'nederlands',
    name: 'Nederlands',
    teacher: 'mw. De Vries',
    target: 7.5,
    grades: [
      g('nl1', 'SO stijlfiguren', 'SO', '2026-09-12', 1, 6.8),
      g('nl2', 'Betoog schrijven', 'PO', '2026-10-03', 2, 7.4),
      g('nl3', 'PW literatuurgeschiedenis', 'PW', '2026-11-18', 3, 5.9, 2),
    ],
  },
  {
    slug: 'engels',
    name: 'Engels',
    teacher: 'dhr. Bakker',
    target: 8,
    grades: [
      g('en1', 'SO irregular verbs', 'SO', '2026-09-05', 1, 8.4),
      g('en2', 'Reading comprehension', 'PW', '2026-10-11', 3, 7.9),
      g('en3', 'Presentation', 'PO', '2026-11-24', 2, 8.6, 2),
    ],
  },
  {
    slug: 'natuurkunde',
    name: 'Natuurkunde',
    teacher: 'dhr. Jansen',
    target: 7,
    grades: [
      g('na1', 'SO krachten', 'SO', '2026-09-19', 1, 5.2),
      g('na2', 'PW mechanica', 'PW', '2026-10-24', 3, 6.1),
    ],
  },
  {
    slug: 'scheikunde',
    name: 'Scheikunde',
    teacher: 'mw. Willems',
    target: 7,
    grades: [
      g('sk1', 'SO zuren & basen', 'SO', '2026-09-26', 1, 6.4),
      g('sk2', 'Practicum titraties', 'Praktisch', '2026-10-30', 2, 7.8),
    ],
  },
  {
    slug: 'wiskunde-b',
    name: 'Wiskunde B',
    teacher: 'dhr. Smit',
    target: 6.5,
    grades: [
      g('wi1', 'SO functies', 'SO', '2026-09-08', 1, 4.8),
      g('wi2', 'PW differentiëren', 'PW', '2026-10-17', 3, 5.4),
    ],
  },
  {
    slug: 'biologie',
    name: 'Biologie',
    teacher: 'mw. Peters',
    target: 8.5,
    grades: [
      g('bi1', 'SO celbiologie', 'SO', '2026-09-15', 1, 9.1),
      g('bi2', 'PW genetica', 'PW', '2026-10-22', 3, 8.7),
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
  status: 'todo' | 'bezig' | 'review' | 'klaar';
  priority: 'laag' | 'normaal' | 'hoog';
  estimate: string;
  tags: string[];
};

export const TASKS: Task[] = [
  {
    id: 't1',
    title: 'Samenvatting hoofdstuk 4 maken',
    subject: 'Wiskunde B',
    due: '2026-08-05',
    status: 'bezig',
    priority: 'hoog',
    estimate: '1u 30m',
    tags: ['samenvatting'],
  },
  {
    id: 't2',
    title: 'Essay literatuur afronden',
    subject: 'Nederlands',
    due: '2026-08-06',
    status: 'review',
    priority: 'hoog',
    estimate: '45m',
    tags: ['schrijven', 'deadline'],
  },
  {
    id: 't3',
    title: 'Irregular verbs oefenen',
    subject: 'Engels',
    due: '2026-08-07',
    status: 'todo',
    priority: 'normaal',
    estimate: '20m',
    tags: ['woordjes'],
  },
];

export const TASK_COLUMNS: Task['status'][] = ['todo', 'bezig', 'review', 'klaar'];
export const TASK_LABELS: Record<Task['status'], string> = {
  todo: 'Te doen',
  bezig: 'Bezig',
  review: 'Nakijken',
  klaar: 'Klaar',
};

/* -------------------------------- analytics ------------------------------- */

export const HEATMAP: number[] = Array.from({ length: 182 }, (_, i) => {
  const v = (Math.sin(i / 5) + Math.cos(i / 3.3) + 2) / 4;
  return i % 17 === 0 ? 0 : Math.round(v * 4);
});

export const MINUTES_PER_DAY = [24, 41, 12, 55, 33, 68, 19];

export const NOTIFICATIONS = [
  {
    title: 'Essay literatuur',
    body: 'Deadline over 3 dagen — status: nakijken',
    time: '10 min',
    unread: true,
  },
  {
    title: 'Nieuwe set gedeeld',
    body: "4V Nederlands — klas A deelde 'Tekstverbanden'",
    time: '1 uur',
    unread: true,
  },
  {
    title: 'Herhaling klaar',
    body: '63 kaarten staan klaar in VWO 4',
    time: '3 uur',
    unread: true,
  },
  {
    title: 'Cijfer toegevoegd',
    body: 'Natuurkunde — PW energie & arbeid: 5,8',
    time: 'gisteren',
    unread: false,
  },
];

/* ------------------------------ agenda extras ----------------------------- */

export type Reminder = { title: string; time: string; subject?: string; repeat?: string };

export const REMINDERS: Reminder[] = [
  {
    title: 'Herhaalsessie Wiskunde B',
    time: '07:45',
    subject: 'Wiskunde B',
    repeat: 'Elke werkdag',
  },
  { title: 'Woordjes Engels', time: '16:30', subject: 'Engels', repeat: 'Ma, wo, vr' },
];

export const TIMETABLE = [
  { period: '1', time: '08:30', subject: 'Wiskunde B', room: '3.02', teacher: 'dhr. Smit' },
  { period: '2', time: '09:20', subject: 'Nederlands', room: '1.14', teacher: 'mw. De Vries' },
  { period: '3', time: '10:30', subject: 'Scheikunde', room: '2.14', teacher: 'mw. Willems' },
  { period: '4', time: '11:20', subject: 'Engels', room: '1.05', teacher: 'dhr. Bakker' },
];
