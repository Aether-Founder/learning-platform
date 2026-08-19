'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  Search,
  Settings,
  User,
  Moon,
  Sun,
  Plus,
  FileText,
  FilePlus2,
  BookOpen,
  Menu,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useUser, useUserProfile } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/useTranslation';
import { useTheme } from 'next-themes';
import { useNavbarPreferences, type NavPage } from '@/hooks/useNavbarPreferences';
import { MobileNavigation } from './MobileNavigation';
import { MobileBottomNav } from './MobileBottomNav';

export function SearchField({
  value,
  onChange,
  placeholder,
  className = '',
  showMoreResults = false,
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
  showMoreResults?: boolean;
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
      {showMoreResults && val.length >= 2 && (
        <Link
          href="/zoeken"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary hover:underline"
        >
          Meer resultaten
        </Link>
      )}
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

function MoreMenu({ items }: { items: Array<{ href: string; label: string }> }) {
  const [mounted, setMounted] = useState(false);
  const ref = useOutside<HTMLDivElement>(() => {});
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) {
    return null;
  }

  return (
    <div className="relative group" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-label={t('nav_more')}
      >
        {t('nav_more')}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <div className="absolute left-0 top-full z-40 mt-2 w-52 rounded-md border border-border bg-background p-1 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        {items.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`block rounded-[6px] px-3 py-2 text-xs transition-colors hover:bg-secondary hover:text-foreground ${
              pathname === m.href ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function BijhoudenMenu({ items }: { items: Array<{ href: string; label: string }> }) {
  const [mounted, setMounted] = useState(false);
  const ref = useOutside<HTMLDivElement>(() => {});
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) {
    return null;
  }

  return (
    <div className="relative group" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Bijhouden
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <div className="absolute left-0 top-full z-40 mt-2 w-48 rounded-md border border-border bg-background p-1 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        {items.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`block rounded-[6px] px-3 py-2 text-xs transition-colors hover:bg-secondary hover:text-foreground ${
              pathname === m.href ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuickCreateMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useOutside<HTMLDivElement>(() => setOpen(false));

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-secondary text-primary hover:bg-secondary/80 transition-colors"
        aria-label="Snel maken"
      >
        <Plus className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-md border border-border bg-background p-1 shadow-xl">
          <Link
            href="/create/leerlijst"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs transition-colors hover:bg-secondary hover:text-foreground text-muted-foreground"
          >
            <FilePlus2 className="h-4 w-4" />+ Voeg je eerste leerlijst toe
          </Link>
          <button
            type="button"
            onClick={async () => {
              const {
                data: { user },
              } = await (await import('@/lib/supabase/client')).supabase.auth.getUser();
              if (user) {
                const { useWorkspaceStore } = await import('@/store/useWorkspaceStore');
                const workspace = useWorkspaceStore.getState();
                const newId = workspace.createItemOptimistic({
                  user_id: user.id,
                  name: 'Nieuwe notitie',
                  type: 'page',
                  parent_id: null,
                  content: '',
                  order_index: 0,
                });
                workspace.setSelectedId(newId);
              }
              setOpen(false);
              window.location.href = '/notities';
            }}
            className="flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs transition-colors hover:bg-secondary hover:text-foreground text-muted-foreground w-full text-left"
          >
            <FileText className="h-4 w-4" />
            Maak notitie
          </button>
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
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!mounted) {
    return <div className="h-9 w-9 rounded-full border border-border bg-muted" />;
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
  fullWidth = false,
  hideFooter = false,
}: {
  children: ReactNode;
  search?: string;
  onSearch?: (value: string) => void;
  fullWidth?: boolean;
  hideFooter?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile } = useUserProfile();
  const { t } = useTranslation();
  const { visibility, PAGE_LABELS, PAGE_HREFS, getVisiblePages } = useNavbarPreferences();
  const [mounted, setMounted] = useState(false);
  const [overflowItems, setOverflowItems] = useState<Array<{ href: string; label: string }>>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const [navWidth, setNavWidth] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visiblePages = getVisiblePages();
  const allNav = useMemo(
    () =>
      visiblePages.map((page) => ({
        href: PAGE_HREFS[page],
        label: PAGE_LABELS[page],
      })),
    [visiblePages, PAGE_HREFS, PAGE_LABELS]
  );

  const hiddenNav = useMemo(
    () =>
      Object.entries(visibility)
        .filter(([key, visible]) => !visible)
        .map(([key]) => ({
          href: PAGE_HREFS[key as NavPage],
          label: PAGE_LABELS[key as NavPage],
        })),
    [visibility, PAGE_HREFS, PAGE_LABELS]
  );

  // Disable overflow calculation to show all visible items as buttons
  useEffect(() => {
    setOverflowItems([]);
  }, [mounted, allNav]);

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

  const visibleNav = allNav.filter((item) => !overflowItems.some((oi) => oi.href === item.href));

  return (
    <div className="min-h-screen bg-background">
      <style jsx global>{`
        .mask-linear-fade {
          mask-image: linear-gradient(to right, black 90%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, black 90%, transparent 100%);
        }
      `}</style>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <div className="flex items-center gap-2.5">
            <MobileNavigation />
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/aether-logo.png"
                alt={t('logo_alt')}
                width={28}
                height={28}
                className="h-7 w-7 rounded-md object-contain"
              />
              <span className="font-display text-2xl font-semibold tracking-tight hidden sm:block">
                {t('brand')}
              </span>
            </Link>
          </div>

          <nav ref={navRef} className="hidden items-center justify-center gap-0.5 lg:flex ml-2">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors hover:text-foreground ${
                  isActive(item.href) ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="group">
              <BijhoudenMenu
                items={[
                  { href: PAGE_HREFS.inbox, label: PAGE_LABELS.inbox },
                  { href: PAGE_HREFS.foutenlogboek, label: PAGE_LABELS.foutenlogboek },
                  { href: PAGE_HREFS.planner, label: PAGE_LABELS.planner },
                ]}
              />
            </div>
            {overflowItems.length > 0 && <MoreMenu items={overflowItems} />}
            <QuickCreateMenu />
          </nav>

          <div className="flex items-center gap-3 ml-auto">
            <SearchField
              {...(search !== undefined ? { value: search } : {})}
              {...(onSearch ? { onChange: onSearch } : {})}
              className="hidden w-52 xl:block"
              showMoreResults={true}
            />
            <UserMenu />
          </div>
        </div>
      </header>

      <main
        className={
          fullWidth ? 'w-full px-6 pb-20 md:pb-24' : 'mx-auto max-w-6xl px-6 pb-20 md:pb-24'
        }
      >
        {children}
      </main>

      <MobileBottomNav />

      {!hideFooter && (
        <footer className="border-t border-border hidden md:block">
          <div className="mx-auto flex flex-wrap items-center justify-between gap-3 max-w-6xl px-6 py-8 text-xs text-muted-foreground">
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
      )}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  fullWidth = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <section
      className={`flex flex-wrap items-center justify-start gap-6 border-b border-border py-10 ${fullWidth ? 'mx-auto max-w-6xl px-6' : 'px-6'}`}
    >
      <div className="max-w-2xl text-left">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] max-w-[480px]:text-[1.75rem] max-w-[480px]:leading-[1.2]">
          {title}
        </h1>
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
