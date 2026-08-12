/**
 * Custom React Hook for Supabase Realtime Events
 * 
 * Reusable hook that can be used in any component
 */

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface MagisterEvent {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  title: string;
  raw_payload: any;
  created_at?: string;
  updated_at?: string;
}

interface UseRealtimeEventsOptions {
  onInsert?: (event: MagisterEvent) => void;
  onUpdate?: (event: MagisterEvent) => void;
  onDelete?: (event: Partial<MagisterEvent>) => void;
  autoFetch?: boolean; // Automatically fetch initial data
}

export function useRealtimeEvents(options: UseRealtimeEventsOptions = {}) {
  const [events, setEvents] = useState<MagisterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const supabase = createClientComponentClient();
  const { onInsert, onUpdate, onDelete, autoFetch = true } = options;

  // Fetch events from database
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error: fetchError } = await supabase
        .from('magister_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;

      setEvents(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Handle realtime changes
  const handleRealtimeChange = useCallback((
    payload: RealtimePostgresChangesPayload<MagisterEvent>
  ) => {
    console.log('📡 Realtime change:', payload.eventType, payload);

    switch (payload.eventType) {
      case 'INSERT':
        // Add new event to state
        setEvents(prev => {
          const exists = prev.some(e => e.id === payload.new.id);
          if (exists) return prev;

          const updated = [...prev, payload.new].sort((a, b) => 
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          );
          
          return updated;
        });
        
        // Call custom handler
        onInsert?.(payload.new);
        break;

      case 'UPDATE':
        // Update existing event in state
        setEvents(prev => {
          const updated = prev.map(event =>
            event.id === payload.new.id ? payload.new : event
          );

          // Re-sort in case time changed
          return updated.sort((a, b) => 
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          );
        });

        // Call custom handler
        onUpdate?.(payload.new);
        break;

      case 'DELETE':
        // Remove event from state
        setEvents(prev => prev.filter(event => event.id !== payload.old.id));

        // Call custom handler
        onDelete?.(payload.old);
        break;
    }
  }, [onInsert, onUpdate, onDelete]);

  // Setup Realtime subscription
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsConnected(false);
        return;
      }

      // Fetch initial data if enabled
      if (autoFetch) {
        await fetchEvents();
      }

      console.log('🔌 Subscribing to magister_events for user:', user.id);

      // Create subscription
      channel = supabase
        .channel('magister_events_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'magister_events',
            filter: `user_id=eq.${user.id}`
          },
          handleRealtimeChange
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    setupSubscription();

    // Cleanup
    return () => {
      if (channel) {
        console.log('🔌 Unsubscribing from Realtime');
        supabase.removeChannel(channel);
        setIsConnected(false);
      }
    };
  }, [supabase, autoFetch, fetchEvents, handleRealtimeChange]);

  // Manually add event to state (useful for optimistic updates)
  const addEvent = useCallback((event: MagisterEvent) => {
    setEvents(prev => {
      const exists = prev.some(e => e.id === event.id);
      if (exists) return prev;

      return [...prev, event].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });
  }, []);

  // Manually update event in state
  const updateEvent = useCallback((eventId: string, updates: Partial<MagisterEvent>) => {
    setEvents(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, ...updates } : event
      )
    );
  }, []);

  // Manually remove event from state
  const removeEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  return {
    events,
    loading,
    error,
    isConnected,
    fetchEvents,
    addEvent,
    updateEvent,
    removeEvent,
  };
}

// Example usage in a component:
export function ExampleCalendarPage() {
  const { 
    events, 
    loading, 
    error,
    isConnected,
    fetchEvents 
  } = useRealtimeEvents({
    onInsert: (event) => {
      console.log('New event synced:', event.title);
      // Show toast notification
    },
    onUpdate: (event) => {
      console.log('Event updated:', event.title);
      // Show toast notification
    },
    onDelete: (event) => {
      console.log('Event deleted:', event.id);
      // Show toast notification
    },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{isConnected ? 'Live' : 'Disconnected'}</span>
      </div>

      <div className="space-y-4">
        {events.map(event => (
          <div key={event.id} className="p-4 border rounded">
            <h3>{event.title}</h3>
            <p>{new Date(event.start_time).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <button onClick={fetchEvents} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Refresh
      </button>
    </div>
  );
}
