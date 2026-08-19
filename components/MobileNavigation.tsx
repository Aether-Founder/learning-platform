'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, Calendar, BookOpen, BarChart3, User, Settings, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/leersets', icon: BookOpen, label: 'Leersets' },
    { href: '/calendar', icon: Calendar, label: 'Kalender' },
    { href: '/agenda', icon: Calendar, label: 'Agenda' },
    { href: '/study', icon: BookOpen, label: 'Studeren' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/statistieken', icon: BarChart3, label: 'Statistieken' },
    { href: '/profile', icon: User, label: 'Profiel' },
    { href: '/instellingen', icon: Settings, label: 'Instellingen' },
    { href: '/vakken', icon: BookOpen, label: 'Vakken' },
    { href: '/notities', icon: FileText, label: 'Notities' },
  ];

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <nav className="flex flex-col gap-4 mt-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
