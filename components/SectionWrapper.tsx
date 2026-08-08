import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Flashcard from './Flashcard';

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

interface SectionWrapperProps {
  section: Section;
  cardIndex: number;
}

export default function SectionWrapper({ section, cardIndex }: SectionWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section id={section.id} className="scroll-mt-20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 border-b border-border bg-background px-6 py-4 text-left transition-colors hover:bg-muted"
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        <h2 className="text-xl font-semibold text-foreground font-serif">{section.title}</h2>
      </button>
      {isExpanded && (
        <div className="divide-y divide-border">
          {section.cards.map((card, index) => (
            <Flashcard
              key={card.id}
              id={card.id}
              index={cardIndex + index + 1}
              question={card.question}
              answer={card.answer}
            />
          ))}
        </div>
      )}
    </section>
  );
}
