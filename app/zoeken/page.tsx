'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader, SearchField } from '@/components/AppShell';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';
import { BookOpen, FileText, CheckSquare, Calendar, Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';

const supabase = browserClient as any;

type SearchResult = {
  id: string;
  type: 'study_set' | 'note' | 'task' | 'calendar_event';
  title: string;
  description?: string;
  link: string;
  relevance: number;
};

export default function ZoekenPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
        setSearched(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setSearched(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const allResults: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Search study sets
    const { data: studySets } = await supabase
      .from('study_sets')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${lowerQuery}%,description.ilike.%${lowerQuery}%`);

    if (studySets) {
      studySets.forEach((set: any) => {
        allResults.push({
          id: set.id,
          type: 'study_set',
          title: set.title,
          description: set.description,
          link: `/leersets`,
          relevance: calculateRelevance(set.title, set.description, searchQuery),
        });
      });
    }

    // Search notes/workspace items
    const { data: workspaceItems } = await supabase
      .from('workspace_items')
      .select('*')
      .eq('user_id', user.id)
      .or(`name.ilike.%${lowerQuery}%`);

    if (workspaceItems) {
      workspaceItems.forEach((item: any) => {
        allResults.push({
          id: item.id,
          type: 'note',
          title: item.name,
          description: item.type === 'map' ? 'Map' : 'Pagina',
          link: '/notities',
          relevance: calculateRelevance(item.name, '', searchQuery),
        });
      });
    }

    // Search tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${lowerQuery}%,description.ilike.%${lowerQuery}%`);

    if (tasks) {
      tasks.forEach((task: any) => {
        allResults.push({
          id: task.id,
          type: 'task',
          title: task.title,
          description: task.description,
          link: '/planner',
          relevance: calculateRelevance(task.title, task.description, searchQuery),
        });
      });
    }

    // Search calendar events
    const { data: calendarEvents } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${lowerQuery}%,description.ilike.%${lowerQuery}%`);

    if (calendarEvents) {
      calendarEvents.forEach((event: any) => {
        allResults.push({
          id: event.id,
          type: 'calendar_event',
          title: event.title,
          description: event.description,
          link: '/calendar',
          relevance: calculateRelevance(event.title, event.description, searchQuery),
        });
      });
    }

    // Sort by relevance
    allResults.sort((a, b) => b.relevance - a.relevance);

    setResults(allResults);
    setLoading(false);
  };

  const calculateRelevance = (
    title: string,
    description: string | undefined,
    query: string
  ): number => {
    const lowerTitle = title.toLowerCase();
    const lowerDesc = (description || '').toLowerCase();
    const lowerQuery = query.toLowerCase();

    let score = 0;

    // Exact match in title
    if (lowerTitle === lowerQuery) score += 100;
    // Title starts with query
    else if (lowerTitle.startsWith(lowerQuery)) score += 50;
    // Title contains query
    else if (lowerTitle.includes(lowerQuery)) score += 25;

    // Description contains query
    if (lowerDesc.includes(lowerQuery)) score += 10;

    return score;
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'study_set':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'note':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'task':
        return <CheckSquare className="h-5 w-5 text-green-500" />;
      case 'calendar_event':
        return <Calendar className="h-5 w-5 text-orange-500" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'study_set':
        return 'Studie Set';
      case 'note':
        return 'Notitie';
      case 'task':
        return 'Taak';
      case 'calendar_event':
        return 'Afspraak';
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('search_eyebrow')}
        title={t('search_title')}
        description={t('search_description')}
      />

      <div className="mt-6">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={t('search_placeholder')}
          className="max-w-2xl"
        />
      </div>

      <div className="mt-8">
        {loading && <div className="text-center text-sm text-muted-foreground">Zoeken...</div>}

        {!loading && !searched && (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Zoek door je content</p>
            <p className="text-sm text-muted-foreground">
              Typ hierboven om te zoeken in je studie sets, notities, taken en agenda.
            </p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Geen resultaten</p>
            <p className="text-sm text-muted-foreground">Probeer een andere zoekterm.</p>
          </div>
        )}

        {!loading && searched && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{results.length} resultaten gevonden</p>
            {results.map((result) => (
              <Link
                key={result.id}
                href={result.link}
                className="block p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getIcon(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{result.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
