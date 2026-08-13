'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown, Search, Settings, User, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useUser, useUserProfile } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/useTranslation';
import { useTheme } from 'next-themes';

export function SearchField({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [inner, setInner] = useState('');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const val = value ?? inner;
  
  if (!mounted) {
    return (
      <div className={'relative ' + className}>
        <div className="h-9 w-full rounded-md border border-input bg-background px-3" />
      </div>
    );
  }
  
  return (
    <div className={'relative ' + className}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        value={val}
        onChange={(e) => (onChange ? onChange(e.target.value) : setInner(e.target.value))}
        placeholder={placeholder ?? t('search_placeholder_sets')}
        aria-label={t('search_aria')}
        className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
      />
    </div>
  );
}

function useOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
}

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useOutside<HTMLDivElement>(() => setOpen(false));
  const pathname = usePathname();
  const { t } = useTranslation();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const more = [
    { href: '/decks', label: t('nav_decks') },
    { href: '/lessen', label: t('nav_lessons') },
    { href: '/groepen', label: t('nav_groups') },
    { href: '/zoeken', label: t('nav_search') },
    { href: '/statistieken', label: t('nav_statistics') },
    { href: '/instellingen', label: t('nav_settings') },
  ];

  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground"
      >
        {t('nav_more')}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {t('nav_more')}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-52 rounded-md border border-border bg-background p-1 shadow-xl">
          {more.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => setOpen(false)}
              className={`block rounded-[6px] px-3 py-2 text-xs transition-colors hover:bg-secondary hover:text-foreground ${
                pathname === m.href ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {m.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useOutside<HTMLDivElement>(() => setOpen(false));
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { user } = useUser();
  const { profile } = useUserProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = () => {
    const name = profile?.full_name || profile?.username || user?.email || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-full border border-border bg-muted" />
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid h-9 w-9 place-items-center rounded-full border border-border text-sm font-medium transition-colors hover:border-foreground/40 overflow-hidden"
        title="Profielmenu"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span>{getInitials()}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-md border border-border bg-background p-1 shadow-xl">
          <Link
            href="/instellingen"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5" />
            {t('nav_settings')}
          </Link>
          <Link
            href="/instellingen"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors hover:bg-secondary hover:text-foreground"
          >
            <User className="h-3.5 w-3.5" />
            Profiel bewerken
          </Link>
          <button
            type="button"
            onClick={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors hover:bg-secondary hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === 'dark' ? t('light_mode') : t('dark_mode')}
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({
  children,
  search,
  onSearch,
}: {
  children: ReactNode;
  search?: string;
  onSearch?: (value: string) => void;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile } = useUserProfile();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const nav = [
    { href: '/', label: t('nav_overview') },
    { href: '/vakken', label: t('nav_subjects') },
    { href: '/agenda', label: t('nav_agenda') },
    { href: '/cijfers', label: t('nav_grades') },
    { href: '/planner', label: t('nav_planner') },
    { href: '/notities', label: t('nav_notes') },
  ];
  const moreNav = [
    { href: '/decks', label: t('nav_decks') },
    { href: '/lessen', label: t('nav_lessons') },
    { href: '/groepen', label: t('nav_groups') },
    { href: '/zoeken', label: t('nav_search') },
    { href: '/statistieken', label: t('nav_statistics') },
    { href: '/instellingen', label: t('nav_settings') },
  ];
  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    user?.email ||
    'Aether';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-muted" />
              <div className="h-8 w-24 rounded-md bg-muted" />
            </div>
            <div className="ml-auto h-9 w-48 rounded-md bg-muted" />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 pb-24">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/aether-logo.png"
              alt={t('logo_alt')}
              width={28}
              height={28}
              className="h-7 w-7 rounded-md object-contain"
            />
            <span className="font-display text-2xl font-semibold tracking-tight">{t('brand')}</span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors hover:text-foreground ${
                  isActive(item.href)
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <MoreMenu />
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <SearchField
              {...(search !== undefined ? { value: search } : {})}
              {...(onSearch ? { onChange: onSearch } : {})}
              className="hidden w-52 xl:block"
            />
            <UserMenu />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 lg:hidden">
          <nav className="flex gap-1 overflow-x-auto pb-2">
            {[...nav, ...moreNav].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary hover:text-foreground ${
                  isActive(item.href) ? 'bg-secondary text-foreground' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground">
          <span className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <Image
              src="/aether-logo.png"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 rounded object-contain"
              aria-hidden="true"
            />
            {t('brand')}
          </span>
          <span>{t('brand_tagline')}</span>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-10">
      <div className="max-w-xl">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1]">{title}</h1>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </section>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3">
      <h2 className="font-display text-2xl font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function Meter({ value }: { value: number }) {
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-foreground/70 transition-all"
        style={{ width: `${Math.max(value, 2)}%` }}
      />
    </div>
  );
}
