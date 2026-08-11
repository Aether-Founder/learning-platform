'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Property = {
  id: string;
  name: string;
  type: string;
  config: any;
  order_index: number;
};

type Entry = {
  id: string;
  sort_order: number;
  values: Record<string, any>;
};

type DatabaseViewProps = {
  databaseId: string;
};

export default function TableView({ databaseId }: DatabaseViewProps) {
  const supabase = createClientComponentClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch properties
        const { data: propsData } = await supabase
          .from('notion_properties')
          .select('*')
          .eq('database_id', databaseId)
          .order('order_index');

        if (propsData) {
          setProperties(propsData);
        }

        // Fetch entries with their values
        const { data: entriesData } = await supabase
          .from('notion_entries')
          .select('*, notion_property_values(property_id, value)')
          .eq('database_id', databaseId)
          .order('sort_order');

        if (entriesData) {
          const enrichedEntries = entriesData.map((entry: any) => ({
            id: entry.id,
            sort_order: entry.sort_order,
            values: Object.fromEntries(
              entry.notion_property_values?.map((pv: any) => [pv.property_id, pv.value]) || []
            ),
          }));
          setEntries(enrichedEntries);
        }
      } catch (error) {
        console.error('Failed to fetch database data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [databaseId, supabase]);

  if (loading) {
    return <div className="p-4 text-gray-500">Loading table...</div>;
  }

  const renderCellValue = (property: Property, value: any) => {
    if (value === null || value === undefined) return <span className="text-gray-400">Empty</span>;

    switch (property.type) {
      case 'checkbox':
        return value ? '✓' : '○';
      case 'select':
      case 'multi_select':
        const options = Array.isArray(value) ? value : [value];
        return (
          <div className="flex gap-1 flex-wrap">
            {options.map((opt: any, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                {typeof opt === 'object' ? opt.name : opt}
              </span>
            ))}
          </div>
        );
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'url':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Link
          </a>
        );
      default:
        return <span>{String(value)}</span>;
    }
  };

  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase font-medium">
          <tr>
            {properties.map((prop) => (
              <th key={prop.id} className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                {prop.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          {entries.length === 0 ? (
            <tr>
              <td colSpan={properties.length} className="px-4 py-8 text-center text-gray-500">
                No entries yet. Add your first row.
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                {properties.map((prop) => (
                  <td key={`${entry.id}-${prop.id}`} className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    {renderCellValue(prop, entry.values[prop.id])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
