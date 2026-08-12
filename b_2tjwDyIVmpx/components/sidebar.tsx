'use client';

import { useEffect, useState } from 'react';
import { flashcardSections } from '../lib/flashcard-data';
import { ThemeToggle } from './theme-toggle';
import { cn } from '../lib/utils';

export function Sidebar() {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    flashcardSections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="hidden xl:flex flex-col fixed left-0 top-0 h-screen w-[280px] border-r border-border bg-background/80 backdrop-blur-sm">
      <div className="p-5 border-b border-border">
        <h2 className="text-sm font-medium text-foreground mb-3">Sections</h2>
        <ThemeToggle />
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {flashcardSections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-md text-[13px] transition-colors',
                  'hover:bg-secondary/80',
                  activeSection === section.id
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground/70 font-mono">
                    {section.timestamp}
                  </span>
                  <span className="line-clamp-2 leading-snug">{section.title}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">Made by Dwarkesh Patel</p>
      </div>
    </aside>
  );
}
