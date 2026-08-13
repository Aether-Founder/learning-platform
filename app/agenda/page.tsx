'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Clock3, MapPin, Plus } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';

type AgendaEvent = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string;
  eventType?: string;
};

type EventForm = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  eventType: 'other' | 'huiswerk' | 'toets' | 'examen' | 'les' | 'project';
};

function localDateTime(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

function emptyForm() {
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { title: '', description: '', startDate: localDateTime(start), endDate: localDateTime(end), location: '', eventType: 'other' as const };
}

export default function AgendaPage() {
  const router = useRouter();
  const { t, currentLanguage } = useTranslation();
  const dateLocale = currentLanguage === 'nl' ? 'nl-NL' : 'en-US';
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login?redirectTo=/agenda');
      return;
    }
    try {
      const response = await fetch('/api/calendar', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('agenda_load_error'));
      setEvents(data.events || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('agenda_load_error'));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const createEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login?redirectTo=/agenda'); return; }
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...form, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('agenda_create_error'));
      setEvents((current) => [...current, data.event].sort((a, b) => a.startDate.localeCompare(b.startDate)));
      setOpen(false);
      setForm(emptyForm());
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : t('agenda_create_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('agenda_eyebrow')}
        title={t('agenda_title')}
        description={t('agenda_description')}
        action={<Button onClick={() => { setForm(emptyForm()); setError(''); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />{t('agenda_new')}</Button>}
      />

      <div className="flex items-center justify-between gap-4 py-6">
        <p className="text-sm text-muted-foreground">{t(events.length === 1 ? 'agenda_count_one' : 'agenda_count_other', undefined, { n: events.length })}</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/calendar')}><CalendarPlus className="mr-2 h-4 w-4" />{t('agenda_calendar_view')}</Button>
      </div>

      {error && <p className="mb-4 rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-500">{error}</p>}
      {loading ? <div className="py-16 text-center text-sm text-muted-foreground">{t('agenda_loading')}</div> : events.length === 0 ? (
        <section className="rounded-xl border border-dashed border-border p-10 text-center">
          <CalendarPlus className="mx-auto h-9 w-9 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl font-semibold">{t('agenda_empty')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('agenda_empty_desc')}</p>
          <Button className="mt-6" onClick={() => { setForm(emptyForm()); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />{t('agenda_empty_cta')}</Button>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{t('agenda_new')}</DialogTitle></DialogHeader>
          <form onSubmit={createEvent} className="space-y-4">
            <div><Label htmlFor="agenda-title">{t('agenda_field_title')}</Label><Input id="agenda-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required placeholder={t('agenda_title_placeholder')} /></div>
            <div><Label htmlFor="agenda-description">{t('agenda_field_description')}</Label><Input id="agenda-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="agenda-start">{t('agenda_field_start')}</Label><Input id="agenda-start" type="datetime-local" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required /></div><div><Label htmlFor="agenda-end">{t('agenda_field_end')}</Label><Input id="agenda-end" type="datetime-local" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} required /></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="agenda-type">{t('agenda_field_type')}</Label><select id="agenda-type" value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value as EventForm['eventType'] })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="other">{t('agenda_type_other')}</option><option value="huiswerk">{t('agenda_type_homework')}</option><option value="toets">{t('agenda_type_test')}</option><option value="examen">{t('agenda_type_exam')}</option><option value="les">{t('agenda_type_lesson')}</option><option value="project">{t('agenda_type_project')}</option></select></div><div><Label htmlFor="agenda-location">{t('agenda_field_location')}</Label><Input id="agenda-location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div></div>
            <Button type="submit" disabled={saving} className="w-full">{saving ? t('agenda_saving') : t('agenda_save')}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
