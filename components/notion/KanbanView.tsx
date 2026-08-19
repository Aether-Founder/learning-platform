'use client';

import { useEffect, useMemo, useState } from 'react';
import { GripVertical, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Property = { id: string; name: string; type: string; config: unknown; order_index: number };
type Entry = { id: string; sort_order: number; values: Record<string, unknown> };

export type KanbanViewProps = { databaseId: string; groupByPropertyId?: string };

function valueLabel(value: unknown): string {
  if (Array.isArray(value)) return value.map(valueLabel).join(', ');
  if (value && typeof value === 'object' && 'name' in value)
    return String((value as { name: unknown }).name);
  return value === null || value === undefined || value === '' ? 'Geen waarde' : String(value);
}

function propertyOptions(property: Property, entries: Entry[]): string[] {
  const config = property.config as { options?: unknown[] } | null;
  const configured = config?.options?.map(valueLabel).filter(Boolean) || [];
  const used = entries
    .map((entry) => valueLabel(entry.values[property.id]))
    .filter((value) => value !== 'Geen waarde');
  return Array.from(new Set([...configured, ...used, 'Geen waarde']));
}

export default function KanbanView({ databaseId, groupByPropertyId }: KanbanViewProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const client = supabase as any;
      const [{ data: propertyData }, { data: entryData }] = await Promise.all([
        client
          .from('notion_properties')
          .select('*')
          .eq('database_id', databaseId)
          .order('order_index'),
        client
          .from('notion_entries')
          .select('id, sort_order, notion_property_values(property_id, value)')
          .eq('database_id', databaseId)
          .order('sort_order'),
      ]);
      if (cancelled) return;
      setProperties(propertyData || []);
      setEntries(
        (entryData || []).map((entry: any) => ({
          id: entry.id,
          sort_order: entry.sort_order,
          values: Object.fromEntries(
            (entry.notion_property_values || []).map((item: any) => [item.property_id, item.value])
          ),
        }))
      );
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [databaseId]);

  const groupProperty = useMemo(
    () =>
      properties.find((property) => property.id === groupByPropertyId) ||
      properties.find((property) => property.type === 'select'),
    [groupByPropertyId, properties]
  );
  const columns = useMemo(
    () => (groupProperty ? propertyOptions(groupProperty, entries) : []),
    [entries, groupProperty]
  );
  const titleProperty = properties.find((property) => property.type === 'text');

  const moveEntry = (entryId: string, column: string) => {
    if (!groupProperty) return;
    setEntries((current) =>
      current.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              values: {
                ...entry.values,
                [groupProperty.id]: column === 'Geen waarde' ? null : column,
              },
            }
          : entry
      )
    );
    const client = supabase as any;
    void client
      .from('notion_property_values')
      .upsert(
        {
          entry_id: entryId,
          property_id: groupProperty.id,
          value: column === 'Geen waarde' ? null : column,
        },
        { onConflict: 'entry_id,property_id' }
      );
    setDraggedId(null);
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Kanban laden…
      </div>
    );
  if (!groupProperty)
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Voeg een select-property toe om een Kanban-board te maken.
      </div>
    );

  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex min-w-[760px] gap-4">
        {columns.map((column) => {
          const cards = entries.filter(
            (entry) => valueLabel(entry.values[groupProperty.id]) === column
          );
          return (
            <section
              key={column}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData('text/plain');
                if (id) moveEntry(id, column);
              }}
              className={`w-64 shrink-0 rounded-lg border p-3 transition-colors ${draggedId ? 'border-dashed border-foreground/40' : 'border-border'} bg-secondary/30`}
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{column}</h3>
                <span className="text-xs text-muted-foreground">{cards.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {cards.map((entry) => (
                  <article
                    key={entry.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', entry.id);
                      setDraggedId(entry.id);
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    className="cursor-grab rounded-md border border-border bg-background p-3 shadow-sm active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {valueLabel(
                            titleProperty
                              ? entry.values[titleProperty.id]
                              : entry.values[properties[0]?.id]
                          ) || `Entry ${entry.id.slice(0, 6)}`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {properties
                            .filter(
                              (property) =>
                                property.id !== groupProperty.id &&
                                valueLabel(entry.values[property.id]) !== 'Geen waarde'
                            )
                            .slice(0, 2)
                            .map((property) => (
                              <span
                                key={property.id}
                                className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
                              >
                                {valueLabel(entry.values[property.id])}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-secondary"
                >
                  <Plus className="h-3.5 w-3.5" /> Kaart toevoegen
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
