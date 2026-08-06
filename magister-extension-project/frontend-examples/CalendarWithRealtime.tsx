'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Type definitions matching your database schema
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

export default function CalendarWithRealtime() {
  const [events, setEvents] = useState<MagisterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'disconnected'>('disconnected');
  
  const supabase = createClientComponentClient();

  // Initial data fetch
  useEffect(() => {
    fetchEvents();
  }, []);

  // Subscribe to Realtime changes
  useEffect(() => {
    // Get current user
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No user logged in');
        return;
      }

      console.log('🔌 Setting up Realtime subscription for user:', user.id);
      setSyncStatus('connected');

      // Subscribe to changes on magister_events table filtered by user_id
      const channel = supabase
        .channel('magister_events_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'magister_events',
            filter: `user_id=eq.${user.id}` // Only listen to current user's events
          },
          (payload: RealtimePostgresChangesPayload<MagisterEvent>) => {
            console.log('📡 Realtime event received:', payload.eventType, payload);
            handleRealtimeChange(payload);
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setSyncStatus('connected');
          }
        });

      // Cleanup subscription on unmount
      return () => {
        console.log('🔌 Unsubscribing from Realtime');
        supabase.removeChannel(channel);
      };
    };

    const unsubscribe = setupRealtimeSubscription();

    return () => {
      unsubscribe.then(cleanup => cleanup?.());
    };
  }, []);

  // Fetch initial events
  async function fetchEvents() {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('magister_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
    } finally {
      setLoading(false);
    }
  }

  // Handle Realtime changes
  function handleRealtimeChange(payload: RealtimePostgresChangesPayload<MagisterEvent>) {
    setSyncStatus('syncing');

    switch (payload.eventType) {
      case 'INSERT':
        handleInsert(payload.new);
        break;
      
      case 'UPDATE':
        handleUpdate(payload.new);
        break;
      
      case 'DELETE':
        handleDelete(payload.old);
        break;
    }

    // Reset sync status after animation
    setTimeout(() => setSyncStatus('connected'), 1000);
  }

  // Handle INSERT events
  function handleInsert(newEvent: MagisterEvent) {
    console.log('➕ Inserting new event:', newEvent.title);
    
    setEvents(prevEvents => {
      // Check if event already exists (shouldn't happen, but just in case)
      const exists = prevEvents.some(e => e.id === newEvent.id);
      if (exists) return prevEvents;

      // Add new event and re-sort by start_time
      const updated = [...prevEvents, newEvent].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

      return updated;
    });

    // Optional: Show toast notification
    showNotification(`New event: ${newEvent.title}`, 'success');
  }

  // Handle UPDATE events
  function handleUpdate(updatedEvent: MagisterEvent) {
    console.log('✏️ Updating event:', updatedEvent.title);
    
    setEvents(prevEvents => {
      const updated = prevEvents.map(event =>
        event.id === updatedEvent.id ? updatedEvent : event
      );

      // Re-sort in case time changed
      return updated.sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });

    // Optional: Show toast notification
    showNotification(`Event updated: ${updatedEvent.title}`, 'info');
  }

  // Handle DELETE events
  function handleDelete(deletedEvent: Partial<MagisterEvent>) {
    console.log('🗑️ Deleting event:', deletedEvent.id);
    
    setEvents(prevEvents => 
      prevEvents.filter(event => event.id !== deletedEvent.id)
    );

    // Optional: Show toast notification
    showNotification(`Event removed`, 'warning');
  }

  // Simple notification system (replace with your toast library)
  function showNotification(message: string, type: 'success' | 'info' | 'warning') {
    // Implement your notification UI here
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Sync Status Indicator */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Calendar</h1>
        
        <div className="flex items-center gap-2">
          <div className={`
            w-3 h-3 rounded-full transition-all duration-300
            ${syncStatus === 'connected' ? 'bg-green-500' : ''}
            ${syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' : ''}
            ${syncStatus === 'disconnected' ? 'bg-red-500' : ''}
          `} />
          <span className="text-sm text-gray-600">
            {syncStatus === 'connected' && 'Live sync active'}
            {syncStatus === 'syncing' && 'Syncing...'}
            {syncStatus === 'disconnected' && 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Calendar Events List */}
      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-2">No events found</p>
          <p className="text-sm text-gray-400">
            Visit Magister to sync your calendar events
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <CalendarEventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Manual Refresh Button (optional) */}
      <button
        onClick={fetchEvents}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        🔄 Manual Refresh
      </button>
    </div>
  );
}

// Calendar Event Card Component
function CalendarEventCard({ event }: { event: MagisterEvent }) {
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {event.title}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span>{formatDate(startDate)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span>🕐</span>
              <span>{formatTime(startDate)} - {formatTime(endDate)}</span>
            </div>
          </div>

          {/* Optional: Show additional info from raw_payload */}
          {event.raw_payload?.Lokatie && (
            <div className="mt-2 text-sm text-gray-500">
              📍 {event.raw_payload.Lokatie}
            </div>
          )}
          
          {event.raw_payload?.Docenten && event.raw_payload.Docenten.length > 0 && (
            <div className="mt-1 text-sm text-gray-500">
              👤 {event.raw_payload.Docenten.map((d: any) => d.Naam).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
