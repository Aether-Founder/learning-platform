'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';

import { supabase } from '@/lib/supabase/client';
import { CalendarView } from '@/components/CalendarView';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/useTranslation';

type EventType = 'other' | 'huiswerk' | 'toets' | 'examen' | 'les' | 'project';

type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color?: string;
  eventType?: EventType;
};

type EventForm = {
  title: string;
  date: string;
  time: string;
  duration: '30' | '60' | '120';
  eventType: EventType;
  notes: string;
};

const EVENT_TYPES: EventType[] = ['les', 'other', 'examen', 'huiswerk'];

function dateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function emptyForm(date = new Date()): EventForm {
  return { title: '', date: dateValue(date), time: timeValue(date), duration: '60', eventType: 'other', notes: '' };
}

function formFromEvent(event: CalendarEvent): EventForm {
  const start = new Date(event.startDate);
  const duration = Math.round((new Date(event.endDate).getTime() - start.getTime()) / 60000);
  const supportedDuration = duration === 30 || duration === 120 ? String(duration) : '60';
  return {
    title: event.title,
    date: dateValue(start),
    time: timeValue(start),
    duration: supportedDuration as EventForm['duration'],
    eventType: event.eventType || 'other',
    notes: event.description || '',
  };
}

export default function CalendarPage() {
  const { t } = useTranslation();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    let localEvts: CalendarEvent[] = [];
    try {
      const stored = localStorage.getItem('aether_agenda_events');
      if (stored) {
        const parsed = JSON.parse(stored);
        localEvts = parsed.map((e: any) => ({
          ...e,
          startDate: new Date(e.startDate),
          endDate: new Date(e.endDate),
        }));
      }
    } catch {
      /* ignore */
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/calendar', { headers: { Authorization: `Bearer ${session.access_token}` } });
        const data = await response.json();
        if (response.ok && data.events) {
          const apiEvts = data.events.map((event: any) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
          }));
          const mergedMap = new Map<string, CalendarEvent>();
          [...localEvts, ...apiEvts].forEach((item) => mergedMap.set(item.id, item));
          const merged = Array.from(mergedMap.values());
          setEvents(merged);
          try {
            localStorage.setItem('aether_agenda_events', JSON.stringify(merged));
          } catch {
            /* storage full */
          }
          setLoading(false);
          return;
        }
      }
    } catch (loadError) {
      console.warn('Calendar API fetch fallback to local:', loadError);
    }

    setEvents(localEvts);
    setLoading(false);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const openCreate = (date = new Date()) => {
    setEditingId(null);
    setForm(emptyForm(date));
    setError('');
    setOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditingId(event.id);
    setForm(formFromEvent(event));
    setError('');
    setOpen(true);
  };

  const saveEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    if (!form.title.trim()) {
      setError('Titel is verplicht');
      setSaving(false);
      return;
    }

    const start = new Date(`${form.date}T${form.time}`);
    const end = new Date(start.getTime() + Number(form.duration) * 60 * 1000);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Ongeldige datum of tijd');
      setSaving(false);
      return;
    }

    const eventId = editingId || 'cal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const newEvent: CalendarEvent = {
      id: eventId,
      title: form.title.trim(),
      description: form.notes.trim() || undefined,
      startDate: start,
      endDate: end,
      allDay: false,
      eventType: form.eventType,
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch(editingId ? `/api/calendar/${editingId}` : '/api/calendar', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.notes.trim(),
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            eventType: form.eventType,
          }),
        });
      }
    } catch (saveError) {
      console.warn('Network issue saving calendar event, saved locally:', saveError);
    }

    setEvents((prev) => {
      const updated = [...prev.filter((e) => e.id !== eventId), newEvent];
      try {
        localStorage.setItem('aether_agenda_events', JSON.stringify(updated));
      } catch {
        /* storage full */
      }
      return updated;
    });

    setOpen(false);
    setSaving(false);
  };

  const deleteEvent = async () => {
    if (!editingId || !window.confirm(t('calendar_delete_confirm'))) return;
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch(`/api/calendar/${editingId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } catch (deleteError) {
      console.warn('Network issue deleting calendar event:', deleteError);
    }

    setEvents((prev) => {
      const updated = prev.filter((e) => e.id !== editingId);
      try {
        localStorage.setItem('aether_agenda_events', JSON.stringify(updated));
      } catch {
        /* storage full */
      }
      return updated;
    });

    setOpen(false);
    setSaving(false);
  };


  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">{t('agenda_eyebrow')}</p><h1 className="text-3xl font-bold">{t('calendar_title')}</h1></div>
        <Button onClick={() => openCreate()}><Plus className="mr-2 h-4 w-4" />{t('calendar_add')}</Button>
      </div>

      {error && <p className="mb-4 rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-500">{error}</p>}
      {loading ? <div className="flex min-h-[500px] items-center justify-center text-sm text-muted-foreground">{t('calendar_loading')}</div> : <>
        {events.length === 0 && <section className="mb-6 rounded-xl border border-dashed border-border p-8 text-center"><CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">{t('calendar_empty')}</p><Button variant="outline" className="mt-4" onClick={() => openCreate()}><Plus className="mr-2 h-4 w-4" />{t('calendar_add')}</Button></section>}
        <CalendarView events={events} onDateClick={openCreate} onAddEvent={openCreate} onEventClick={openEdit} />
      </>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editingId ? t('calendar_edit') : t('calendar_add')}</DialogTitle></DialogHeader>

          <form onSubmit={saveEvent} className="space-y-4">
            <div><Label htmlFor="calendar-title">{t('calendar_field_title')}</Label><Input id="calendar-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required placeholder={t('calendar_title_placeholder')} /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="calendar-date">{t('calendar_field_date')}</Label><Input id="calendar-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></div><div><Label htmlFor="calendar-time">{t('calendar_field_time')}</Label><Input id="calendar-time" type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} required /></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="calendar-duration">{t('calendar_field_duration')}</Label><select id="calendar-duration" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value as EventForm['duration'] })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="30">{t('calendar_duration_30')}</option><option value="60">{t('calendar_duration_60')}</option><option value="120">{t('calendar_duration_120')}</option></select></div><div><Label htmlFor="calendar-type">{t('calendar_field_type')}</Label><select id="calendar-type" value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value as EventType })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{EVENT_TYPES.map((type) => <option key={type} value={type}>{t(`agenda_type_${type === 'les' ? 'lesson' : type === 'other' ? 'other' : type === 'examen' ? 'exam' : 'homework'}`)}</option>)}</select></div></div>
            <div><Label htmlFor="calendar-notes">{t('calendar_field_notes')}</Label><Textarea id="calendar-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder={t('calendar_notes_placeholder')} /></div>
            <DialogFooter><div className="flex w-full items-center justify-between gap-2"><div>{editingId && <Button type="button" variant="destructive" onClick={deleteEvent} disabled={saving}><Trash2 className="mr-2 h-4 w-4" />{t('delete')}</Button>}</div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button><Button type="submit" disabled={saving}><Pencil className="mr-2 h-4 w-4" />{saving ? t('calendar_saving') : t('calendar_save')}</Button></div></div></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
