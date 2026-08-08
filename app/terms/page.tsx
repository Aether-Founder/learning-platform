import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-semibold">Algemene Voorwaarden</h1>
      <p className="mt-4 text-sm text-muted-foreground">Laatst bijgewerkt: 6 augustus 2026</p>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>Dit zijn de algemene voorwaarden van Aether Toetsweekvoorbereiding.</p>
        <p className="rounded-md border border-border bg-secondary/40 p-4 font-mono text-xs">
          [Placeholder content - Algemene Voorwaarden worden hier getoond]
        </p>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          &larr; Terug naar dashboard
        </Link>
      </div>
    </div>
  );
}
