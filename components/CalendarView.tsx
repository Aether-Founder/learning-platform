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
  isSameMonth,
  startOfWeek,
  endOfWeek,
  isWeekend,
} from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/useTranslation';

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
  const { t, currentLanguage } = useTranslation();
  const dateLocale = currentLanguage === 'nl' ? nl : enUS;
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

  const getEventsForDate = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    return (
      <div className="overflow-hidden rounded-2xl border border-blue-300/20 bg-[#09152b] text-blue-100 shadow-xl shadow-blue-950/10">
        <div className="grid grid-cols-7 border-b border-blue-200/15 bg-[#0d1b35]">
          {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((dayKey, index) => (
            <div
              key={dayKey}
              className="px-2 py-3 text-[10px] font-medium tracking-[0.16em] text-blue-200/75 sm:px-3"
            >
              {t(`calendar_dow_${dayKey}`)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());
            const isOutsideMonth = !isSameMonth(day, currentDate);
            const isWeekendDay = isWeekend(day);
            return (
              <div
                key={day.toISOString()}
                onClick={() => onDateClick?.(day)}
                className={`min-h-[92px] cursor-pointer border-b border-r border-blue-200/15 p-2 transition-colors hover:bg-blue-400/10 sm:min-h-[112px] sm:p-3 ${isToday ? 'bg-blue-400/15' : ''} ${isWeekendDay ? 'bg-[#0a1830]' : ''} ${isOutsideMonth ? 'opacity-35' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs ${isToday ? 'font-bold text-blue-300' : 'text-blue-100/75'}`}
                  >
                    {format(day, 'd')}
                  </span>
                  {isToday && <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />}
                </div>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className="truncate rounded px-1.5 py-1 text-[9px] font-medium text-blue-50 shadow-sm"
                      style={{ backgroundColor: event.color || '#173b70' }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-blue-200/50">
                      {t('calendar_more', undefined, { n: dayEvents.length - 3 })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
                    {format(day, 'EEEE', { locale: dateLocale })}
                  </span>
                  <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>
                    {format(day, 'd MMM', { locale: dateLocale })}
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
              {format(currentDate, 'EEEE d MMMM yyyy', { locale: dateLocale })}
            </h2>
            <Button size="sm" onClick={() => onAddEvent?.(currentDate)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('calendar_add_event')}
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
              <p className="text-muted-foreground text-center py-8">
                {t('calendar_no_events_day')}
              </p>
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
        <h2 className="text-xl font-semibold mb-4">{t('calendar_upcoming_events')}</h2>
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
                  {format(new Date(event.startDate), 'EEEE d MMMM yyyy HH:mm', {
                    locale: dateLocale,
                  })}
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
          <p className="text-muted-foreground text-center py-8">{t('calendar_no_upcoming')}</p>
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
            {t('calendar_today')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold ml-4">
            {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
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
              {t(`calendar_${v === 'workweek' ? 'workweek' : v}`)}
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
