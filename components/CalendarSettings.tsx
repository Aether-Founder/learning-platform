'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Calendar as CalendarIcon } from 'lucide-react';

type CalendarView = 'day' | 'week' | 'workweek' | 'month' | 'agenda';
type FirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface CalendarSettingsProps {
  userId: string;
}

export function CalendarSettings({ userId }: CalendarSettingsProps) {
  const [defaultView, setDefaultView] = useState<CalendarView>('month');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<FirstDayOfWeek>(1);
  const [showWeekends, setShowWeekends] = useState(true);
  const [showWeekNumbers, setShowWeekNumbers] = useState(true);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(20);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDefaultView(data.defaultView || 'month');
        setFirstDayOfWeek(data.firstDayOfWeek || 1);
        setShowWeekends(data.showWeekends !== false);
        setShowWeekNumbers(data.showWeekNumbers !== false);
        setStartHour(data.startHour || 8);
        setEndHour(data.endHour || 20);
      }
    } catch (error) {
      console.error('Failed to fetch calendar settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          defaultView,
          firstDayOfWeek,
          showWeekends,
          showWeekNumbers,
          startHour,
          endHour,
        }),
      });

      if (response.ok) {
        // Settings saved successfully
      }
    } catch (error) {
      console.error('Failed to save calendar settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const weekDays = [
    { value: 0, label: 'Zondag' },
    { value: 1, label: 'Maandag' },
    { value: 2, label: 'Dinsdag' },
    { value: 3, label: 'Woensdag' },
    { value: 4, label: 'Donderdag' },
    { value: 5, label: 'Vrijdag' },
    { value: 6, label: 'Zaterdag' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Agenda Instellingen</h2>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Weergave Instellingen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Standaard Weergave</label>
            <Select
              value={defaultView}
              onValueChange={(value: CalendarView) => setDefaultView(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dag</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="workweek">Werkweek</SelectItem>
                <SelectItem value="month">Maand</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Kies de standaard weergave wanneer je de agenda opent
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Eerste Dag van de Week</label>
            <Select
              value={firstDayOfWeek.toString()}
              onValueChange={(value) => setFirstDayOfWeek(parseInt(value) as FirstDayOfWeek)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekDays.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Kies welke dag als eerste dag van de week wordt getoond
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Toon Weekenddagen</label>
              <p className="text-xs text-muted-foreground">
                Toon zaterdag en zondag in de weekweergave
              </p>
            </div>
            <Switch checked={showWeekends} onCheckedChange={setShowWeekends} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Toon Weeknummers</label>
              <p className="text-xs text-muted-foreground">Toon weeknummers in de maandweergave</p>
            </div>
            <Switch checked={showWeekNumbers} onCheckedChange={setShowWeekNumbers} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Werkuren
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Startuur</label>
            <Select
              value={startHour.toString()}
              onValueChange={(value) => setStartHour(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 6).map((hour) => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hour.toString().padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Het uur waarop de dagweergave begint</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Einduur</label>
            <Select
              value={endHour.toString()}
              onValueChange={(value) => setEndHour(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 12).map((hour) => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hour.toString().padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Het uur waarop de dagweergave eindigt</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Settings className="w-8 h-8 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Over Agenda Instellingen</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Standaard weergave wordt gebruikt bij het openen van de agenda</li>
                <li>• Eerste dag van de week bepaalt de weekindeling</li>
                <li>• Weekenddagen kunnen worden verborgen in de werkweekweergave</li>
                <li>• Werkuren bepalen het zichtbare tijdsbereik in de dagweergave</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
