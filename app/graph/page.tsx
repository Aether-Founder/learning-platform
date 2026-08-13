'use client';

import { useState } from 'react';
import { BookOpen, Link2, Network, Search } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useTranslation } from '@/lib/useTranslation';

const NODES = [
  { id: 'energie', label: 'Energiebehoud', kind: 'concept', x: '50%', y: '38%', detail: 'Natuurkunde · Mechanica' },
  { id: 'arbeid', label: 'Arbeid', kind: 'set', x: '19%', y: '22%', detail: '12 kaarten · 64% beheerst' },
  { id: 'kinetisch', label: 'Kinetische energie', kind: 'set', x: '79%', y: '22%', detail: '18 kaarten · 41% beheerst' },
  { id: 'kracht', label: 'Kracht & beweging', kind: 'concept', x: '20%', y: '72%', detail: 'Natuurkunde · hoofdstuk 3' },
  { id: 'formules', label: 'Formules', kind: 'concept', x: '80%', y: '72%', detail: '5 lessen · 2 openstaand' },
  { id: 'wiskunde', label: 'Wiskunde B', kind: 'subject', x: '50%', y: '84%', detail: '6 onderwerpen' },
] as const;

const KIND_KEYS: Record<string, string> = {
  concept: 'graph_kind_concept',
  set: 'graph_kind_set',
  subject: 'graph_kind_subject',
};

const EDGES = [
  ['arbeid', 'energie'], ['kinetisch', 'energie'], ['kracht', 'arbeid'],
  ['kracht', 'wiskunde'], ['formules', 'kinetisch'], ['formules', 'wiskunde'],
] as const;

export default function GraphPage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('energie');
  const current = NODES.find((node) => node.id === selected) ?? NODES[0];

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('graph_eyebrow')}
        title={t('graph_title')}
        description={t('graph_description')}
        action={<div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground"><Network className="h-3.5 w-3.5" /> {t('graph_badge')}</div>}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="relative min-h-[560px] overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border)/.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/.35)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="relative h-[510px]">
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
              {EDGES.map(([from, to]) => {
                const a = NODES.find((node) => node.id === from)!;
                const b = NODES.find((node) => node.id === to)!;
                return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeOpacity=".22" strokeWidth="1.5" />;
              })}
            </svg>
            {NODES.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelected(node.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-4 py-3 text-left shadow-sm transition-transform hover:scale-105 ${selected === node.id ? 'border-foreground bg-foreground text-background' : 'border-border bg-background'}`}
                style={{ left: node.x, top: node.y }}
              >
                <span className="block whitespace-nowrap text-sm font-semibold">{node.label}</span>
                <span className={`mt-1 block text-[10px] uppercase tracking-[0.12em] ${selected === node.id ? 'text-background/70' : 'text-muted-foreground'}`}>{t(KIND_KEYS[node.kind])}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="rounded-xl border border-border bg-card p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input aria-label={t('graph_search')} placeholder={t('graph_search')} className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-foreground/40" />
          </div>
          <div className="mt-8">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t('graph_selected')}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">{current.label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.detail}</p>
          </div>
          <div className="mt-7 space-y-3 border-t border-border pt-5">
            <div className="flex items-center gap-3 text-sm"><BookOpen className="h-4 w-4 text-muted-foreground" /> {t('graph_linked_lessons')}</div>
            <div className="flex items-center gap-3 text-sm"><Link2 className="h-4 w-4 text-muted-foreground" /> {t('graph_related_concepts')}</div>
          </div>
          <button type="button" className="mt-8 h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground hover:opacity-90">{t('graph_start_review')}</button>
        </aside>
      </div>
    </AppShell>
  );
}
