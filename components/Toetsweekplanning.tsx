'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, LayoutGrid, List } from 'lucide-react';

interface Toets {
  vak: string;
  datum: string;
  tijd: string;
  stof: string;
}

interface ToetsweekplanningProps {
  toetsen: Toets[];
}

type ViewMode = 'table' | 'agenda' | 'timeline' | 'compact';

const modeOptions: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'table', label: 'Tabel', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'agenda', label: 'Agenda', icon: <Calendar className="h-4 w-4" /> },
  { id: 'timeline', label: 'Tijdlijn', icon: <Clock className="h-4 w-4" /> },
  { id: 'compact', label: 'Compact', icon: <List className="h-4 w-4" /> },
];

const formatFullDate = (date: string) =>
  new Date(date).toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatShortDate = (date: string) =>
  new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  });

export function Toetsweekplanning({ toetsen }: ToetsweekplanningProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [countdown, setCountdown] = useState({
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const firstToets = toetsen[0];
  const firstToetsDate = useMemo(
    () => new Date(`${firstToets.datum}T${firstToets.tijd.split('-')[0]}`),
    [firstToets.datum, firstToets.tijd]
  );

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = firstToetsDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ weeks, days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [firstToetsDate]);

  const groupedToetsen = toetsen.reduce(
    (acc, toets) => {
      const date = toets.datum;
      if (!acc[date]) acc[date] = [];
      acc[date].push(toets);
      return acc;
    },
    {} as Record<string, Toets[]>
  );

  const renderCountdown = () => (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl">
        <Clock className="h-6 w-6 text-muted-foreground" />
        Tijd tot eerste toets: {firstToets.vak}
      </h2>
      <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5 sm:gap-4">
        {[
          ['Weken', countdown.weeks],
          ['Dagen', countdown.days],
          ['Uren', countdown.hours],
          ['Minuten', countdown.minutes],
          ['Seconden', countdown.seconds],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-background/70 p-3 shadow-sm sm:p-4"
          >
            <div className="text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
              {value}
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="space-y-4">
      {Object.entries(groupedToetsen).map(([date, dayTests]) => (
        <div
          key={date}
          className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
        >
          <div className="border-b border-border bg-secondary/50 px-4 py-3 font-semibold text-foreground">
            {formatFullDate(date)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead className="bg-background/70">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Vak
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tijd
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Stof
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dayTests.map((toets, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{toets.vak}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{toets.tijd}</td>
                    <td className="px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                      {toets.stof}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAgendaView = () => (
    <div className="space-y-4">
      {Object.entries(groupedToetsen).map(([date, dayTests]) => (
        <div key={date} className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">{formatFullDate(date)}</h3>
          </div>
          <div className="space-y-3">
            {dayTests.map((toets, idx) => (
              <div
                key={idx}
                className="rounded-md border border-border border-l-4 bg-background p-3"
              >
                <div className="mb-1 flex items-start justify-between gap-3">
                  <span className="font-semibold text-foreground">{toets.vak}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">{toets.tijd}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{toets.stof}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderTimelineView = () => (
    <div className="relative">
      <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-border" />
      {toetsen.map((toets, idx) => (
        <div key={idx} className="relative pb-6 pl-10">
          <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-background bg-foreground" />
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-start justify-between gap-3">
              <span className="font-semibold text-foreground">{toets.vak}</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {formatShortDate(toets.datum)} - {toets.tijd}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{toets.stof}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCompactView = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {toetsen.map((toets, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/30"
        >
          <div className="mb-1 font-semibold text-foreground">{toets.vak}</div>
          <div className="mb-2 text-sm text-muted-foreground">
            {formatShortDate(toets.datum)} - {toets.tijd}
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{toets.stof}</p>
        </div>
      ))}
    </div>
  );

  const renderView = () => {
    switch (viewMode) {
      case 'table':
        return renderTableView();
      case 'agenda':
        return renderAgendaView();
      case 'timeline':
        return renderTimelineView();
      case 'compact':
        return renderCompactView();
      default:
        return renderTableView();
    }
  };

  return (
    <div className="space-y-6">
      {renderCountdown()}

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-secondary/50 p-1">
        {modeOptions.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setViewMode(mode.id)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
              viewMode === mode.id
                ? 'border border-border bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {renderView()}
    </div>
  );
}
