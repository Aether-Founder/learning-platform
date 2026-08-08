'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';

interface MobileCalendarViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
  events?: Array<{ date: Date; title: string }>;
}

export function MobileCalendarView({
  currentDate,
  onDateChange,
  onAddEvent,
  events = [],
}: MobileCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => event.date.toDateString() === date.toDateString());
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateChange(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <button
                key={index}
                onClick={() => date && handleDateSelect(date)}
                disabled={!date}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative
                  ${!date ? 'opacity-0' : 'hover:bg-muted'}
                  ${date && isToday(date) ? 'bg-primary text-primary-foreground' : ''}
                  ${date && isSelected(date) && !isToday(date) ? 'bg-secondary' : ''}
                `}
              >
                {date && (
                  <>
                    <span>{date.getDate()}</span>
                    {getEventsForDate(date).length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {getEventsForDate(date)
                          .slice(0, 3)
                          .map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-blue-500" />
                          ))}
                      </div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">
              {selectedDate.toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            {onAddEvent && (
              <Button size="sm" onClick={() => onAddEvent(selectedDate)}>
                <Plus className="w-4 h-4 mr-2" />
                Event
              </Button>
            )}
          </div>

          {getEventsForDate(selectedDate).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Geen events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {getEventsForDate(selectedDate).map((event, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium">{event.title}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
