const WIKI_LINK = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;

/** Extract wiki-link targets from markdown, excluding optional display text. */
export function parseLinks(markdown: string): string[] {
  const links: string[] = [];
  for (const match of markdown.matchAll(WIKI_LINK)) {
    const target = match[1].trim();
    if (target) links.push(target);
  }
  return links;
}
