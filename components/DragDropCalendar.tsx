"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, Clock } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
}

interface DragDropCalendarProps {
  onEventCreate?: (event: Omit<Event, "id">) => void;
  existingEvents?: Event[];
}

export function DragDropCalendar({ onEventCreate, existingEvents = [] }: DragDropCalendarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, date: Date) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStartTime(Date.now());
  };

  const handleMouseUp = (e: React.MouseEvent, date: Date) => {
    if (!isDragging || !dragStartTime) return;

    const dragDuration = Date.now() - dragStartTime;
    if (dragDuration > 200) {
      const rect = calendarRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const hour = Math.floor(y / 50);
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

        onEventCreate?.({
          title: "Nieuw Event",
          date,
          startTime,
          endTime,
        });
      }
    }

    setIsDragging(false);
    setDragStartTime(null);
  };

  const getWeekDays = (startDate: Date) => {
    const days = [];
    const current = new Date(startDate);
    current.setDate(current.getDate() - current.getDay());

    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const weekDays = getWeekDays(new Date());
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  const getEventsForDay = (date: Date) => {
    return existingEvents.filter(
      (event) => event.date.toDateString() === date.toDateString()
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sleep & Drop Agenda</h2>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Event Toevoegen
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div ref={calendarRef} className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="text-sm font-medium text-muted-foreground">Tijd</div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="text-center">
                    <div className="text-sm font-medium">
                      {day.toLocaleDateString("nl-NL", { weekday: "short" })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {day.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                {hours.map((hour) => (
                  <div key={hour} className="grid grid-cols-8 gap-2">
                    <div className="text-xs text-muted-foreground text-right pr-2">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {weekDays.map((day) => (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className="relative h-12 border border-border/50 rounded hover:bg-muted/50 cursor-crosshair transition-colors"
                        onMouseDown={(e) => handleMouseDown(e, day)}
                        onMouseUp={(e) => handleMouseUp(e, day)}
                      >
                        {getEventsForDay(day)
                          .filter((event) => parseInt(event.startTime.split(":")[0]) === hour)
                          .map((event) => (
                            <div
                              key={event.id}
                              className="absolute inset-1 bg-blue-500/20 border-l-2 border-blue-500 rounded p-1 text-xs overflow-hidden"
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-muted-foreground">
                                {event.startTime} - {event.endTime}
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CalendarIcon className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-2">Sleep & Drop Instructies</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Klik en sleep op een tijdsblok om een event te maken</li>
                <li>• De lengte van de sleep bepaalt de duur van het event</li>
                <li>• Sleep horizontaal om de datum te wijzigen</li>
                <li>• Sleep verticaal om de tijd te wijzigen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
