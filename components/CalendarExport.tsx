'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar as CalendarIcon, FileText, ExternalLink } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  description?: string;
}

interface CalendarExportProps {
  events: Event[];
}

export function CalendarExport({ events }: CalendarExportProps) {
  const [exporting, setExporting] = useState(false);

  const generateICal = () => {
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Learning Platform//Calendar//NL
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    events.forEach((event) => {
      const startDate = new Date(event.date);
      const [startHour, startMin] = event.startTime.split(':');
      const [endHour, endMin] = event.endTime.split(':');

      startDate.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      icalContent += `BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
DTSTAMP:${formatDate(new Date())}
UID:${event.id}@learningplatform.com
SUMMARY:${event.title}
${event.description ? `DESCRIPTION:${event.description}` : ''}
END:VEVENT
`;
    });

    icalContent += 'END:VCALENDAR';
    return icalContent;
  };

  const downloadICal = () => {
    setExporting(true);
    try {
      const icalContent = generateICal();
      const blob = new Blob([icalContent], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calendar.ics';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download iCal:', error);
    } finally {
      setExporting(false);
    }
  };

  const exportToGoogleCalendar = () => {
    const event = events[0];
    if (!event) return;

    const startDate = new Date(event.date);
    const [startHour, startMin] = event.startTime.split(':');
    const [endHour, endMin] = event.endTime.split(':');

    startDate.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}${event.description ? `&details=${encodeURIComponent(event.description)}` : ''}`;

    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Agenda Export</h2>
        <Badge variant="secondary">{events.length} events</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Export Opties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="border-2 hover:border-primary transition-colors cursor-pointer"
              onClick={downloadICal}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">iCal (.ics)</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Exporteer naar iCal formaat voor Apple Calendar, Outlook, en andere
                      agenda-apps
                    </p>
                    <Button disabled={exporting} size="sm">
                      {exporting ? (
                        <>
                          <Download className="w-4 h-4 mr-2 animate-spin" />
                          Exporteren...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-2 hover:border-primary transition-colors cursor-pointer"
              onClick={exportToGoogleCalendar}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <CalendarIcon className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Google Calendar</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Voeg events direct toe aan je Google Calendar
                    </p>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Openen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Geen events om te exporteren</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Download className="w-8 h-8 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Over Agenda Export</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• iCal formaat werkt met Apple Calendar, Outlook, en meer</li>
                <li>• Google Calendar export opent direct in je browser</li>
                <li>• Alle events worden geëxporteerd inclusief tijden en beschrijvingen</li>
                <li>• Geëxporteerde events kunnen worden geïmporteerd in andere agenda-apps</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
