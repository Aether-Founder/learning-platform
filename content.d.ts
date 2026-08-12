declare module '@/content.json' {
  interface ButtonConfig {
    url: string;
    text: string;
    icon: string;
    iconType?: 'name' | 'url';
    variant?: 'primary' | 'secondary';
    enabled?: boolean;
  }

  interface SubSection {
    id: string;
    title: string;
    questions: Array<{
      id: string;
      number: string;
      text: string;
      answer?: string;
    }>;
  }

  // NEW: Paragraph-based interfaces
  interface ParagraphQuestion {
    id: string;
    number: string;
    question: string;
    answer: string;
    type: 'inline' | 'section';
    difficulty?: 'easy' | 'medium' | 'hard';
  }

  interface Paragraph {
    id: string;
    title?: string;
    content: string;
    questions: ParagraphQuestion[];
  }

  interface EnhancedSection {
    id: string;
    title: string | string[];
    titles?: string[];
    chapterTitles?: string[];
    timestamp?: string;
    // NEW: Paragraph-based content
    paragraphs?: Paragraph[];
    // Legacy support
    subSections?: SubSection[];
    questions?: Array<{
      id: string;
      number: string;
      text: string;
      answer?: string;
    }>;
  }

  const content: {
    siteMetadata: {
      title: string;
      description: string;
    };
    buttons?: ButtonConfig[];
    showExportButtons?: boolean;
    showAnkiExport?: boolean;
    showFlashcardsExport?: boolean;
    showTranscriptExport?: boolean;
    showCopyTranscript?: boolean;
    // NEW: Default view mode
    defaultViewMode?: 'book' | 'study' | 'simple' | 'advanced';
    // NEW: Available view modes on this page only
    availableModes?: ('book' | 'study' | 'simple' | 'advanced')[];
    sections: EnhancedSection[];
  };
  export default content;
}
