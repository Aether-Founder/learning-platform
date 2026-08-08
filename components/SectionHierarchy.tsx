'use client';

import { memo } from 'react';
import { FolderOpen } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Paragraph {
  id: string;
  title?: string;
  content: string;
  questions: any[];
}

interface SubSection {
  id: string;
  title: string;
  questions: any[];
}

interface Section {
  id: string;
  title: string;
  paragraphs?: Paragraph[];
  subSections?: SubSection[];
  questions?: any[];
}

interface SectionHierarchyProps {
  sections: Section[];
}

export const SectionHierarchy = memo(function SectionHierarchy({
  sections,
}: SectionHierarchyProps) {
  const { t } = useTranslation();

  if (!sections || sections.length === 0) return null;

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="bg-secondary/30 border border-border rounded-lg p-6 mb-8">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <FolderOpen className="w-4 h-4" />
        {t('table_of_contents')}
      </h3>
      <div className="space-y-2">
        {sections.map((section, sectionIndex) => {
          const subItems = section.paragraphs || section.subSections || [];
          const hasSubItems = subItems.length > 0;

          return (
            <div key={section.id} className="space-y-1">
              {/* Main Section */}
              <button
                onClick={() => scrollToSection(section.id)}
                className="w-full text-left text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                {section.title}
              </button>

              {/* Sub Items with Tab Indentation */}
              {hasSubItems && (
                <div className="ml-4 space-y-1 border-l-2 border-border/50 pl-3">
                  {subItems.map((item, itemIndex) => {
                    const itemTitle = item.title || `${t('part')} ${itemIndex + 1}`;
                    const itemNumber = `${sectionIndex + 1}.${itemIndex + 1}`;

                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors block"
                      >
                        <span className="tabular-nums">{itemNumber}</span>
                        {itemTitle && <span className="ml-2">{itemTitle}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
});
