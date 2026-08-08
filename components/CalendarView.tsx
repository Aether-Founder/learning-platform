'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isWeekend,
} from 'date-fns';
import { nl } from 'date-fns/locale';

type CalendarView = 'month' | 'week' | 'day' | 'workweek' | 'agenda';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color?: string;
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
}

export function CalendarView({
  events = [],
  onEventClick,
  onDateClick,
  onAddEvent,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week' || view === 'workweek') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week' || view === 'workweek') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = getEventsForDate(day);
          const isToday = isSameDay(day, new Date());
          const isWeekendDay = isWeekend(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              className={`min-h-[100px] p-2 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors ${
                isToday ? 'bg-primary/10 border-primary' : ''
              } ${isWeekendDay ? 'bg-muted/30' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>
                  {format(day, 'd')}
                </span>
                <span className="text-xs text-muted-foreground">W{getWeekNumber(day)}</span>
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className="text-xs p-1 rounded truncate"
                    style={{ backgroundColor: event.color || '#3b82f6', color: 'white' }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} meer</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = (includeWeekend: boolean) => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const filteredDays = includeWeekend ? days : days.filter((day) => !isWeekend(day));

    return (
      <div className="space-y-4">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${filteredDays.length}, 1fr)` }}
        >
          {filteredDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                onClick={() => onDateClick?.(day)}
                className={`p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors ${
                  isToday ? 'bg-primary/10 border-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold ${isToday ? 'text-primary' : ''}`}>
                    {format(day, 'EEEE', { locale: nl })}
                  </span>
                  <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>
                    {format(day, 'd MMM', { locale: nl })}
                  </span>
                </div>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className="p-2 rounded text-sm"
                      style={{ backgroundColor: event.color || '#3b82f6', color: 'white' }}
                    >
                      <div className="font-medium">{event.title}</div>
                      {!event.allDay && (
                        <div className="text-xs opacity-90">
                          {format(new Date(event.startDate), 'HH:mm')} -{' '}
                          {format(new Date(event.endDate), 'HH:mm')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const isToday = isSameDay(currentDate, new Date());

    return (
      <div className="space-y-4">
        <div
          onClick={() => onDateClick?.(currentDate)}
          className={`p-6 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors ${
            isToday ? 'bg-primary/10 border-primary' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {format(currentDate, 'EEEE d MMMM yyyy', { locale: nl })}
            </h2>
            <Button size="sm" onClick={() => onAddEvent?.(currentDate)}>
              <Plus className="w-4 h-4 mr-2" />
              Event toevoegen
            </Button>
          </div>
          <div className="space-y-3">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="p-4 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: event.color || '#3b82f6', color: 'white' }}
              >
                <div className="font-semibold text-lg">{event.title}</div>
                {event.description && <div className="mt-1 opacity-90">{event.description}</div>}
                {!event.allDay && (
                  <div className="mt-2 text-sm opacity-90">
                    {format(new Date(event.startDate), 'HH:mm')} -{' '}
                    {format(new Date(event.endDate), 'HH:mm')}
                  </div>
                )}
              </div>
            ))}
            {dayEvents.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Geen events op deze dag</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const upcomingEvents = sortedEvents
      .filter((event) => new Date(event.startDate) >= new Date())
      .slice(0, 10);

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Aankomende events</h2>
        {upcomingEvents.map((event) => (
          <div
            key={event.id}
            onClick={() => onEventClick?.(event)}
            className="p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{event.title}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(event.startDate), 'EEEE d MMMM yyyy HH:mm', { locale: nl })}
                </div>
              </div>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: event.color || '#3b82f6' }}
              />
            </div>
          </div>
        ))}
        {upcomingEvents.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Geen aankomende events</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Vandaag
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold ml-4">
            {format(currentDate, 'MMMM yyyy', { locale: nl })}
          </h2>
        </div>
        <div className="flex gap-2">
          {(['month', 'week', 'day', 'workweek', 'agenda'] as CalendarView[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView(true)}
      {view === 'workweek' && renderWeekView(false)}
      {view === 'day' && renderDayView()}
      {view === 'agenda' && renderAgendaView()}
    </div>
  );
}
