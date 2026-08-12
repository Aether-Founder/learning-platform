import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { StudySetViewer } from "@/components/StudySet";
import { countSets, resolvePath, type TreeNode } from "@/lib/aether-data";

export const Route = createFileRoute("/vakken/$")({
  head: () => ({
    meta: [
      { title: "Mappen & studiesets — Aether" },
      {
        name: "description",
        content:
          "Navigeer door hoofdstukmappen en open een studieset met flashcards, meerkeuze, toets, quiz, schrijven, match en game.",
      },
      { property: "og:title", content: "Mappen & studiesets — Aether" },
      {
        property: "og:description",
        content: "Open een studieset en oefen met zeven verschillende modi.",
      },
    ],
  }),
  component: BrowsePage,
});

function Crumbs({ segments }: { segments: string[] }) {
  const { subject, trail } = resolvePath(segments);
  return (
    <nav className="flex flex-wrap items-center gap-1.5 pt-8 text-xs text-muted-foreground">
      <Link to="/vakken" className="underline-offset-4 hover:text-foreground hover:underline">
        Vakken
      </Link>
      {subject && (
        <>
          <span aria-hidden="true">/</span>
          <Link
            to="/vakken/$"
            params={{ _splat: subject.slug }}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {subject.name}
          </Link>
        </>
      )}
      {trail.map((n, i) => (
        <span key={n.slug} className="flex items-center gap-1.5">
          <span aria-hidden="true">/</span>
          <Link
            to="/vakken/$"
            params={{ _splat: [subject!.slug, ...trail.slice(0, i + 1).map((t) => t.slug)].join("/") }}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {n.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function FolderList({ base, nodes }: { base: string; nodes: TreeNode[] }) {
  return (
    <ul className="divide-y divide-border">
      {nodes.map((n) => (
        <li key={n.slug}>
          <Link
            to="/vakken/$"
            params={{ _splat: `${base}/${n.slug}` }}
            className="flex flex-wrap items-center gap-4 py-5 transition-colors hover:bg-secondary/40"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {n.kind === "folder" ? "Map" : "Studieset"}
              </p>
              <p className="mt-1 truncate text-[15px] font-semibold">{n.name}</p>
              {n.description && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.description}</p>
              )}
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {n.kind === "folder"
                ? `${countSets(n.children ?? [])} sets`
                : `${n.cards?.length ?? 0} kaarten`}
            </span>
            <span className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium">
              Openen
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BrowsePage() {
  const { _splat } = Route.useParams();
  const segments = (_splat ?? "").split("/").filter(Boolean);
  const { subject, node } = resolvePath(segments);

  if (!subject || (segments.length > 1 && !node)) {
    return (
      <AppShell>
        <div className="py-24 text-center">
          <h1 className="font-display text-3xl font-semibold">Niet gevonden</h1>
          <p className="mt-2 text-sm text-muted-foreground">Deze map of studieset bestaat niet.</p>
          <Link
            to="/vakken"
            className="mt-6 inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Terug naar vakken
          </Link>
        </div>
      </AppShell>
    );
  }

  const base = segments.join("/");
  const isSet = node?.kind === "set";
  const title = node?.name ?? subject.name;
  const description = node?.description;
  const children = node ? (node.children ?? []) : subject.children;

  return (
    <AppShell>
      <Crumbs segments={segments} />

      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-8">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {isSet ? "Studieset" : node ? "Map" : subject.level}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1]">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {description ??
              (node
                ? `${countSets(children)} studiesets in deze map.`
                : `${subject.children.length} mappen · ${countSets(subject.children)} studiesets · ${subject.teacher}`)}
          </p>
        </div>
        {isSet && (
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold tint-warning">
            {node?.cards?.length ?? 0} kaarten
          </span>
        )}
      </section>

      <div className="pt-10">
        {isSet && node?.cards?.length ? (
          <StudySetViewer cards={node.cards} />
        ) : (
          <FolderList base={base} nodes={children} />
        )}
      </div>
    </AppShell>
  );
}
