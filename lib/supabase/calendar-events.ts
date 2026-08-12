import type { Database, Json } from '@/types/database.types';

type CalendarRow = Database['public']['Tables']['calendar_events']['Row'];
type CalendarInsert = Database['public']['Tables']['calendar_events']['Insert'];
type CalendarUpdate = Database['public']['Tables']['calendar_events']['Update'];

type CalendarEventInput = {
  title?: unknown;
  description?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  allDay?: unknown;
  location?: unknown;
  color?: unknown;
  reminderMinutes?: unknown;
  recurrence?: unknown;
  testWeekId?: unknown;
  subjectId?: unknown;
  eventType?: unknown;
};

const eventTypes = new Set(['toets', 'examen', 'huiswerk', 'les', 'project', 'other']);

function isRecord(value: Json | null | undefined): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asDate(value: unknown, field: string) {
  if (typeof value !== 'string' || !value) throw new Error(`${field} is required`);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${field} must be a valid date`);
  return parsed;
}

function splitDateTime(date: Date) {
  const iso = date.toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 19) };
}

function eventType(value: unknown): CalendarRow['event_type'] {
  return typeof value === 'string' && eventTypes.has(value)
    ? value as CalendarRow['event_type']
    : 'other';
}

function metadataFrom(input: CalendarEventInput) {
  return {
    allDay: input.allDay === true,
    color: asOptionalString(input.color),
    recurrence: asOptionalString(input.recurrence),
    testWeekId: asOptionalString(input.testWeekId),
  } as Json;
}

function mergedMetadata(input: CalendarEventInput, current: Json | null | undefined) {
  const existing = isRecord(current) ? current : {};
  return {
    ...existing,
    ...(input.allDay !== undefined ? { allDay: input.allDay === true } : {}),
    ...(input.color !== undefined ? { color: asOptionalString(input.color) } : {}),
    ...(input.recurrence !== undefined ? { recurrence: asOptionalString(input.recurrence) } : {}),
    ...(input.testWeekId !== undefined ? { testWeekId: asOptionalString(input.testWeekId) } : {}),
  } as Json;
}

function dateTimeString(date: string, time: string | null) {
  return `${date}T${time || '00:00:00'}`;
}

export function serializeCalendarEvent(row: CalendarRow) {
  const metadata = isRecord(row.metadata) ? row.metadata : {};
  const allDay = metadata.allDay === true;
  const startDate = dateTimeString(row.event_date, allDay ? null : row.event_time);
  const endDate = dateTimeString(row.event_date, allDay ? null : row.end_time || row.event_time);

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    startDate,
    endDate,
    allDay,
    location: row.location || undefined,
    color: typeof metadata.color === 'string' ? metadata.color : undefined,
    reminderMinutes: row.reminder_minutes || undefined,
    recurrence: typeof metadata.recurrence === 'string' ? metadata.recurrence : undefined,
    testWeekId: typeof metadata.testWeekId === 'string' ? metadata.testWeekId : undefined,
    subjectId: row.subject_id || undefined,
    eventType: row.event_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createCalendarEventInsert(userId: string, input: CalendarEventInput): CalendarInsert {
  if (typeof input.title !== 'string' || !input.title.trim()) throw new Error('Title is required');
  const start = asDate(input.startDate, 'Start date');
  const end = asDate(input.endDate, 'End date');
  if (end < start) throw new Error('End date must be after the start date');

  const startParts = splitDateTime(start);
  const endParts = splitDateTime(end);
  const allDay = input.allDay === true;

  return {
    user_id: userId,
    subject_id: asOptionalString(input.subjectId),
    title: input.title.trim(),
    description: asOptionalString(input.description),
    event_type: eventType(input.eventType),
    event_date: startParts.date,
    event_time: allDay ? null : startParts.time,
    end_time: allDay ? null : endParts.time,
    location: asOptionalString(input.location),
    reminder_minutes: typeof input.reminderMinutes === 'number' ? input.reminderMinutes : null,
    metadata: metadataFrom(input),
  };
}

export function createCalendarEventUpdate(input: CalendarEventInput, currentMetadata: Json | null | undefined): CalendarUpdate {
  const update: CalendarUpdate = {};

  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || !input.title.trim()) throw new Error('Title cannot be empty');
    update.title = input.title.trim();
  }
  if (input.description !== undefined) update.description = asOptionalString(input.description);
  if (input.location !== undefined) update.location = asOptionalString(input.location);
  if (input.subjectId !== undefined) update.subject_id = asOptionalString(input.subjectId);
  if (input.reminderMinutes !== undefined) update.reminder_minutes = typeof input.reminderMinutes === 'number' ? input.reminderMinutes : null;
  if (input.eventType !== undefined) update.event_type = eventType(input.eventType);

  if (input.startDate !== undefined) {
    const start = asDate(input.startDate, 'Start date');
    const startParts = splitDateTime(start);
    update.event_date = startParts.date;
    update.event_time = input.allDay === true ? null : startParts.time;
  }
  if (input.endDate !== undefined && input.allDay !== true) update.end_time = splitDateTime(asDate(input.endDate, 'End date')).time;
  if (input.allDay === true) {
    update.event_time = null;
    update.end_time = null;
  }

  if (input.allDay !== undefined || input.color !== undefined || input.recurrence !== undefined || input.testWeekId !== undefined) {
    update.metadata = mergedMetadata(input, currentMetadata);
  }

  return update;
}
