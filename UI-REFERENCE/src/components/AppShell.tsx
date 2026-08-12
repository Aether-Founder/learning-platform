import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, type ReactNode } from "react";

import logo from "@/assets/logo.png.asset.json";

const NAV = [
  { to: "/", label: "Overzicht" },
  { to: "/vakken", label: "Vakken" },
  { to: "/kalender", label: "Kalender" },
  { to: "/lessen", label: "Lessen" },
  { to: "/groepen", label: "Groepen" },
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
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo.url} alt="Aether logo" className="h-7 w-7 rounded-md object-contain" />
            <span className="font-display text-2xl font-semibold tracking-tight">Aether</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
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
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <SearchField
              {...(search !== undefined ? { value: search } : {})}
              {...(onSearch ? { onChange: onSearch } : {})}
              className="hidden w-56 lg:block"
            />
            <span className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tint-streak sm:inline-flex">
              1 dag streak
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-border text-sm font-medium">
              M
            </span>
          </div>
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
