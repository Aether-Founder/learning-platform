'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Clock3, List, MapPin, Plus } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarView } from '@/components/CalendarView';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';

type AgendaEvent = {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  eventType?: string;
};

type EventForm = {
  title: string;
  date: string;
  time: string;
  duration: '30' | '60' | '120';
  eventType: 'other' | 'huiswerk' | 'toets' | 'examen' | 'les' | 'project';
  notes: string;
};

const EVENT_TYPES: ('other' | 'huiswerk' | 'toets' | 'examen' | 'les' | 'project')[] = ['les', 'other', 'examen', 'huiswerk'];

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

function formFromEvent(event: AgendaEvent): EventForm {
  const start = new Date(event.startDate);
  const duration = Math.round((new Date(event.endDate).getTime() - start.getTime()) / 60000);
  const supportedDuration = duration === 30 || duration === 120 ? String(duration) : '60';
  return {
    title: event.title,
    date: dateValue(start),
    time: timeValue(start),
    duration: supportedDuration as EventForm['duration'],
    eventType: (event.eventType || 'other') as EventForm['eventType'],
    notes: event.description || '',
  };
}

export default function AgendaPage() {
  const { t, currentLanguage } = useTranslation();
  const dateLocale = currentLanguage === 'nl' ? 'nl-NL' : 'en-US';
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const loadEvents = useCallback(async () => {
    let localEvts: AgendaEvent[] = [];
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
          const mergedMap = new Map<string, AgendaEvent>();
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
      console.warn('Agenda API fetch fallback to local:', loadError);
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

  const openEdit = (event: AgendaEvent) => {
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
    const newEvent: AgendaEvent = {
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
    if (!editingId || !window.confirm('Weet je zeker dat je dit evenement wilt verwijderen?')) return;
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
    <AppShell>
      <PageHeader
        eyebrow={t('agenda_eyebrow')}
        title={t('agenda_title')}
        description={t('agenda_description')}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setView(view === 'calendar' ? 'list' : 'calendar')}>
              {view === 'calendar' ? <List className="mr-2 h-4 w-4" /> : <CalendarDays className="mr-2 h-4 w-4" />}
              {view === 'calendar' ? 'Lijstweergave' : 'Kalenderweergave'}
            </Button>
            <Button onClick={() => openCreate()}><Plus className="mr-2 h-4 w-4" />Toevoegen</Button>
          </div>
        }
      />

      {error && <p className="mb-4 rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-500">{error}</p>}
      {loading ? (
        <div className="mt-10 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5">
              <div className="skeleton-line h-4 w-32 rounded mb-2"></div>
              <div className="skeleton-line h-6 w-3/4 rounded"></div>
              <div className="skeleton-line h-4 w-1/2 rounded mt-2"></div>
            </div>
          ))}
        </div>
      ) : view === 'calendar' ? (
        <CalendarView events={events} onDateClick={openCreate} onAddEvent={openCreate} onEventClick={openEdit} />
      ) : events.length === 0 ? (
        <section className="rounded-xl border border-dashed border-border p-10 text-center">
          <CalendarDays className="mx-auto h-9 w-9 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl font-semibold">{t('agenda_empty')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('agenda_empty_desc')}</p>
          <Button className="mt-6" onClick={() => openCreate()}><Plus className="mr-2 h-4 w-4" />{t('agenda_empty_cta')}</Button>
        </section>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {events.map((event) => (
            <article key={event.id} className="grid gap-3 p-5 sm:grid-cols-[180px_1fr]">
              <div className="text-sm text-muted-foreground">
                <p>{new Date(event.startDate).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                {!event.allDay && <p className="mt-1 flex items-center gap-1 text-xs"><Clock3 className="h-3.5 w-3.5" />{new Date(event.startDate).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })} – {new Date(event.endDate).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}</p>}
              </div>
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-medium">{event.title}</h2>{event.eventType && <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">{t(`agenda_type_${event.eventType === 'other' ? 'other' : event.eventType}`)}</span>}</div>
                {event.description && <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>}
                {event.location && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{event.location}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editingId ? 'Evenement bewerken' : t('agenda_new')}</DialogTitle></DialogHeader>

          <form onSubmit={saveEvent} className="space-y-4">
            <div><Label htmlFor="agenda-title">{t('agenda_field_title')}</Label><Input id="agenda-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required placeholder={t('agenda_title_placeholder')} /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="agenda-date">Datum</Label><Input id="agenda-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></div><div><Label htmlFor="agenda-time">Tijd</Label><Input id="agenda-time" type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} required /></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="agenda-duration">Duur</Label><select id="agenda-duration" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value as EventForm['duration'] })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="30">30 minuten</option><option value="60">1 uur</option><option value="120">2 uur</option></select></div><div><Label htmlFor="agenda-type">{t('agenda_field_type')}</Label><select id="agenda-type" value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value as EventForm['eventType'] })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{EVENT_TYPES.map((type) => <option key={type} value={type}>{t(`agenda_type_${type === 'les' ? 'lesson' : type === 'other' ? 'other' : type === 'examen' ? 'exam' : 'homework'}`)}</option>)}</select></div></div>
            <div><Label htmlFor="agenda-notes">Notities</Label><Textarea id="agenda-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Voeg optionele notities toe..." /></div>
            <DialogFooter>
              <div className="flex w-full items-center justify-between gap-2">
                <div>{editingId && <Button type="button" variant="destructive" onClick={deleteEvent} disabled={saving}>Verwijderen</Button>}</div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
                  <Button type="submit" disabled={saving}>{saving ? 'Opslaan...' : 'Opslaan'}</Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
