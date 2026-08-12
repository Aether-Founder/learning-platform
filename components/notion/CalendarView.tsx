'use client';

import { useEffect, useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Property = { id: string; name: string; type: string };
type Entry = { id: string; values: Record<string, unknown> };
export type CalendarViewProps = { databaseId: string; datePropertyId?: string };

function textValue(value: unknown): string {
  if (value && typeof value === 'object' && 'start' in value) return String((value as { start: unknown }).start);
  if (Array.isArray(value)) return value.map(textValue).join(', ');
  return value === null || value === undefined ? '' : String(value);
}

function dateValue(value: unknown): Date | null {
  const raw = textValue(value);
  if (!raw) return null;
  const date = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function CalendarView({ databaseId, datePropertyId }: CalendarViewProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const client = supabase as any;
      const [{ data: propertyData }, { data: entryData }] = await Promise.all([
        client.from('notion_properties').select('id, name, type').eq('database_id', databaseId).order('order_index'),
        client.from('notion_entries').select('id, notion_property_values(property_id, value)').eq('database_id', databaseId).order('sort_order'),
      ]);
      if (cancelled) return;
      setProperties(propertyData || []);
      setEntries((entryData || []).map((entry: any) => ({ id: entry.id, values: Object.fromEntries((entry.notion_property_values || []).map((item: any) => [item.property_id, item.value])) })));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [databaseId]);

  const dateProperty = properties.find((property) => property.id === datePropertyId) || properties.find((property) => property.type === 'date');
  const titleProperty = properties.find((property) => property.type === 'text');
  const days = useMemo(() => eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) }), [month]);
  const entriesByDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    if (!dateProperty) return map;
    entries.forEach((entry) => { const date = dateValue(entry.values[dateProperty.id]); if (!date) return; const key = format(date, 'yyyy-MM-dd'); map.set(key, [...(map.get(key) || []), entry]); });
    return map;
  }, [dateProperty, entries]);

  if (loading) return <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Kalender laden…</div>;
  if (!dateProperty) return <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Voeg een date-property toe om een kalender te maken.</div>;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="font-display text-xl font-semibold">{format(month, 'LLLL yyyy', { locale: nl })}</h2><div className="flex items-center gap-1"><button type="button" onClick={() => setMonth((value) => subMonths(value, 1))} className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary" aria-label="Vorige maand"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => setMonth(new Date())} className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">Vandaag</button><button type="button" onClick={() => setMonth((value) => addMonths(value, 1))} className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary" aria-label="Volgende maand"><ChevronRight className="h-4 w-4" /></button></div></header>
      <div className="grid grid-cols-7 border-b border-border">{['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((day) => <div key={day} className="px-2 py-2 text-center text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{day}</div>)}</div>
      <div className="grid grid-cols-7"><>{days.map((day) => { const dayEntries = entriesByDay.get(format(day, 'yyyy-MM-dd')) || []; return <div key={day.toISOString()} className={`min-h-28 border-b border-r border-border p-2 ${!isSameMonth(day, month) ? 'bg-secondary/20 text-muted-foreground' : ''}`}><span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : ''}`}>{format(day, 'd')}</span><div className="mt-1 space-y-1">{dayEntries.map((entry) => <div key={entry.id} className="truncate rounded bg-secondary px-1.5 py-1 text-[11px]" title={textValue(titleProperty ? entry.values[titleProperty.id] : entry.values[properties[0]?.id])}>{textValue(titleProperty ? entry.values[titleProperty.id] : entry.values[properties[0]?.id]) || 'Zonder titel'}</div>)}</div></div>; })}</></div>
    </section>
  );
}
