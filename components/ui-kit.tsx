import { useEffect, useState, type ReactNode } from 'react';

/* Small presentational primitives shared across the Aether Student OS.
   Styling stays inside the existing token palette. */

export function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={'rounded-lg border border-border ' + className}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
          {title && <h3 className="font-display text-lg font-semibold leading-none">{title}</h3>}
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Badge({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'success' | 'warning' | 'streak' | 'solid' | 'outline';
}) {
  const tones: Record<string, string> = {
    muted: 'bg-secondary text-muted-foreground',
    success: 'tint-success',
    warning: 'tint-warning',
    streak: 'tint-streak',
    solid: 'bg-foreground text-background',
    outline: 'border border-border text-muted-foreground',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ' +
        (active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground')
      }
    >
      {children}
    </button>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  size = 'md',
}: {
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={
            (size === 'sm' ? 'h-7 px-2.5 text-[12px] ' : 'h-8 px-3 text-[13px] ') +
            'rounded-[6px] font-medium transition-colors ' +
            (value === t.value
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground')
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function GhostButton({
  children,
  onClick,
  active,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ' +
        (active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border text-foreground hover:bg-secondary') +
        ' ' +
        className
      }
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 ' +
        className
      }
    >
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button
        type="button"
        aria-label="Sluiten"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/25 backdrop-blur-[2px]"
      />
      <div className="relative z-10 mt-8 w-full max-w-lg rounded-lg border border-border bg-background shadow-2xl">
        <header className="border-b border-border px-6 py-4">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </header>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-border px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-14 text-center">
      <p className="font-display text-xl font-semibold">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={'animate-pulse rounded-md bg-secondary ' + className} />;
}

export function useSimulatedLoad(ms = 550) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

/* --------------------------------- charts -------------------------------- */

export function BarChart({
  values,
  labels,
  height = 120,
}: {
  values: number[];
  labels?: string[];
  height?: number;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {values.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col justify-end gap-2">
          <div
            className="w-full rounded-sm bg-foreground/60 transition-all"
            style={{ height: `${Math.max((v / max) * 100, 3)}%` }}
            title={String(v)}
          />
          {labels && (
            <span className="text-center text-[10px] text-muted-foreground">{labels[i]}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function LineChart({ values, height = 120 }: { values: number[]; height?: number }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${100 - ((v - min) / span) * 90 - 5}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }} className="w-full">
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
        className="text-foreground/70"
      />
    </svg>
  );
}

export function Heatmap({ values, weeks = 26 }: { values: number[]; weeks?: number }) {
  const cols = Array.from({ length: weeks }, (_, w) => values.slice(w * 7, w * 7 + 7));
  return (
    <div className="flex gap-[3px] overflow-x-auto pb-1">
      {cols.map((col, i) => (
        <div key={i} className="flex flex-col gap-[3px]">
          {col.map((v, j) => (
            <span
              key={j}
              title={`${v} sessies`}
              className="h-[10px] w-[10px] rounded-[2px] bg-foreground"
              style={{ opacity: v === 0 ? 0.08 : 0.2 + v * 0.2 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Donut({ value, label }: { value: number; label: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-32 w-32 place-items-center">
      <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
        <circle cx="50" cy="50" r={r} className="fill-none stroke-secondary" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          className="fill-none stroke-foreground/70"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-2xl font-semibold leading-none">{value}%</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

export function KeyValue({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-border">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="font-medium tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------ context menu ------------------------------ */

export function ContextMenu({ items, children }: { items: string[]; children: ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [pos]);

  return (
    <>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setPos({ x: e.clientX, y: e.clientY });
        }}
      >
        {children}
      </div>
      {pos && (
        <div
          className="fixed z-50 w-52 rounded-md border border-border bg-background p-1 shadow-xl"
          style={{ left: pos.x, top: pos.y }}
        >
          {items.map((i) => (
            <button
              key={i}
              type="button"
              className="block w-full rounded-[6px] px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {i}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export function gradeTone(v: number | null): 'success' | 'warning' | 'muted' {
  if (v === null) return 'muted';
  if (v >= 7) return 'success';
  if (v >= 5.5) return 'muted';
  return 'warning';
}

export function fmt(v: number | null, digits = 1) {
  return v === null ? '—' : v.toFixed(digits).replace('.', ',');
}
