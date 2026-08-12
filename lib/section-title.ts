type SectionTitleLike = {
  title?: string | string[];
  titles?: string[];
  chapterTitles?: string[];
};

export function getSectionTitles(section: SectionTitleLike): string[] {
  const rawTitles =
    Array.isArray(section.titles) && section.titles.length
      ? section.titles
      : Array.isArray(section.chapterTitles) && section.chapterTitles.length
        ? section.chapterTitles
        : Array.isArray(section.title)
          ? section.title
          : section.title
            ? [section.title]
            : [];

  return rawTitles.map((title) => title.trim()).filter(Boolean);
}

export function getSectionTitle(section: SectionTitleLike, fallback = 'Zonder titel'): string {
  const titles = getSectionTitles(section);
  return titles.length ? titles.join(' + ') : fallback;
}
