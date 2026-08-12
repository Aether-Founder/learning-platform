import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface FlashcardProps {
  id: string;
  index: number;
  question: string;
  answer: string;
}

export default function Flashcard({ id, question, answer }: FlashcardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div id={id} className="border-b border-border">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            setIsExpanded((value) => !value);
          }
        }}
        aria-expanded={isExpanded}
        className="w-full flex items-start gap-4 p-6 text-left cursor-pointer"
      >
        <div className="flex-1">
          <div className="font-serif text-lg leading-relaxed text-foreground">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {question}
            </ReactMarkdown>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        )}
      </div>
      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="font-serif text-base leading-relaxed text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {answer}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
