export interface WikiLink {
  target: string;
  alias?: string;
}

export class MarkdownProcessor {
  static parseWikiLinks(content: string): WikiLink[] {
    const wikiLinkRegex = /\[\[([^\]]+)\](?:\|([^\]]+))?\]/g;
    const links: WikiLink[] = [];
    let match;

    while ((match = wikiLinkRegex.exec(content)) !== null) {
      links.push({
        target: match[1],
        alias: match[2],
      });
    }

    return links;
  }

  static replaceWikiLinks(content: string, linkRenderer: (link: WikiLink) => string): string {
    return content.replace(/\[\[([^\]]+)\](?:\|([^\]]+))?\]/g, (match, target, alias) => {
      return linkRenderer({ target, alias });
    });
  }

  static extractTags(content: string): string[] {
    const tagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }

    return [...new Set(tags)];
  }

  static extractFrontmatter(content: string): { frontmatter: Record<string, any>; content: string } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { frontmatter: {}, content };
    }

    const frontmatterLines = match[1].split('\n');
    const frontmatter: Record<string, any> = {};

    for (const line of frontmatterLines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        frontmatter[key.trim()] = value;
      }
    }

    return { frontmatter, content: match[2] };
  }

  static addFrontmatter(content: string, frontmatter: Record<string, any>): string {
    const frontmatterString = Object.entries(frontmatter)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return `---\n${frontmatterString}\n---\n\n${content}`;
  }
}

