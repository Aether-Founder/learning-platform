'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { CalendarView } from '@/components/CalendarView';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color?: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: false,
    color: '#3b82f6',
  });

  const loadEvents = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/calendar');
        return;
      }

      const response = await fetch('/api/calendar', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedEvents = data.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          allDay: event.allDay,
          color: event.color,
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setNewEvent({
      title: '',
      description: '',
      startDate: date.toISOString().slice(0, 16),
      endDate: new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
      allDay: false,
      color: '#3b82f6',
    });
    setShowAddEvent(true);
  };

  const handleCreateEvent = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/calendar');
        return;
      }

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          startDate: new Date(newEvent.startDate).toISOString(),
          endDate: new Date(newEvent.endDate).toISOString(),
          allDay: newEvent.allDay,
          color: newEvent.color,
        }),
      });

      if (response.ok) {
        setShowAddEvent(false);
        loadEvents();
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Laden...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Kalender</h1>
        <Button onClick={() => handleAddEvent(new Date())}>
          <Plus className="w-4 h-4 mr-2" />
          Event toevoegen
        </Button>
      </div>

      <CalendarView events={events} onDateClick={handleAddEvent} onAddEvent={handleAddEvent} />

      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event titel"
              />
            </div>
            <div>
              <Label htmlFor="description">Beschrijving</Label>
              <Input
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Optionele beschrijving"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Startdatum</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={newEvent.startDate}
                onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Einddatum</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={newEvent.endDate}
                onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateEvent} className="flex-1">
                Aanmaken
              </Button>
              <Button variant="outline" onClick={() => setShowAddEvent(false)} className="flex-1">
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
