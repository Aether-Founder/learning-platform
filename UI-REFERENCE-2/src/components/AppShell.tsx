import { Link } from "@tanstack/react-router";
import { Bell, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import logo from "@/assets/logo.png.asset.json";
import { NOTIFICATIONS } from "@/lib/os-data";

const NAV = [
  { to: "/", label: "Overzicht" },
  { to: "/vakken", label: "Vakken" },
  { to: "/agenda", label: "Agenda" },
  { to: "/cijfers", label: "Cijfers" },
  { to: "/planner", label: "Planner" },
  { to: "/notities", label: "Notities" },
] as const;

const MORE = [
  { to: "/decks", label: "Decks & review" },
  { to: "/lessen", label: "Lessen" },
  { to: "/groepen", label: "Groepen" },
  { to: "/statistieken", label: "Statistieken" },
  { to: "/instellingen", label: "Instellingen" },
] as const;

export function SearchField({
  value,
  onChange,
  placeholder = "Zoek in sets en lessen",
  className = "",
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [inner, setInner] = useState("");
  const val = value ?? inner;
  return (
    <div className={"relative " + className}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        value={val}
        onChange={(e) => (onChange ? onChange(e.target.value) : setInner(e.target.value))}
        placeholder={placeholder}
        aria-label="Zoeken"
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
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useOutside<HTMLDivElement>(() => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Meer
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-52 rounded-md border border-border bg-background p-1 shadow-xl">
          {MORE.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              onClick={() => setOpen(false)}
              className="block rounded-[6px] px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:text-foreground"
            >
              {m.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useOutside<HTMLDivElement>(() => setOpen(false));
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Meldingen"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-md border border-border transition-colors hover:bg-secondary"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold tint-streak">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-md border border-border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-display text-base font-semibold">Meldingen</span>
            <span className="text-[11px] text-muted-foreground">{unread} nieuw</span>
          </div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {NOTIFICATIONS.map((n) => (
              <li key={n.title} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground"
                    style={{ opacity: n.unread ? 1 : 0.15 }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug">{n.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{n.time} geleden</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-4 py-2.5 text-center">
            <span className="text-[11px] text-muted-foreground">Alles gemarkeerd als gelezen</span>
          </div>
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
  onSearch?: (v: string) => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo.url} alt="Aether logo" className="h-7 w-7 rounded-md object-contain" />
            <span className="font-display text-2xl font-semibold tracking-tight">Aether</span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="relative px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground data-[status=active]:after:absolute data-[status=active]:after:inset-x-3 data-[status=active]:after:-bottom-[21px] data-[status=active]:after:h-px data-[status=active]:after:bg-foreground"
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
            <span className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tint-streak sm:inline-flex">
              12 dagen streak
            </span>
            <NotificationBell />
            <span className="grid h-9 w-9 place-items-center rounded-full border border-border text-sm font-medium">
              M
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 lg:hidden">
          <nav className="flex gap-1 overflow-x-auto pb-2">
            {[...NAV, ...MORE].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
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
            <img src={logo.url} alt="" className="h-5 w-5 rounded object-contain" aria-hidden="true" />
            Aether
          </span>
          <span>Studeer slimmer, onthoud langer.</span>
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

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
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
