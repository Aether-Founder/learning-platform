interface Card {
  id: string;
  question: string;
  answer: string;
}

interface Section {
  id: string;
  title: string;
  cards: Card[];
}

interface ContentData {
  siteMetadata: {
    title: string;
    description: string;
  };
  sections: Section[];
}

export function exportToMarkdown(data: ContentData): void {
  let markdown = `# ${data.siteMetadata.title}\n\n`;
  markdown += `${data.siteMetadata.description}\n\n`;

  data.sections.forEach((section) => {
    markdown += `## ${section.title}\n\n`;
    section.cards.forEach((card, index) => {
      markdown += `### Q${index + 1}\n\n`;
      markdown += `${card.question}\n\n`;
      markdown += `**Answer:** ${card.answer}\n\n`;
      markdown += `---\n\n`;
    });
  });

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.siteMetadata.title.replace(/\s+/g, '-').toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToAnki(data: ContentData): void {
  let csv = 'Front,Back,Tags\n';

  data.sections.forEach((section) => {
    section.cards.forEach((card) => {
      const front = card.question.replace(/"/g, '""');
      const back = card.answer.replace(/"/g, '""');
      const tags = section.title.replace(/\s+/g, '_').toLowerCase();
      csv += `"${front}","${back}","${tags}"\n`;
    });
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.siteMetadata.title.replace(/\s+/g, '-').toLowerCase()}-anki.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
