import type { StudySet, Term } from '@/types/learning-platform';
import { getErrorMessage } from '../errors';
import { createId } from './question-generator';

export interface ParsedCards {
  terms: Term[];
  warnings: string[];
}

function newTerm(input: Partial<Term> & { term: string; definition: string }, index: number): Term {
  const now = new Date();
  return {
    id: input.id || createId(`card-${index}`),
    term: input.term,
    definition: input.definition,
    front: input.front || input.term,
    back: input.back || input.definition,
    cardType: input.cardType || 'basic',
    tags: input.tags || [],
    learningSetId: input.learningSetId,
    learningSetTitle: input.learningSetTitle,
    isStarred: Boolean(input.isStarred),
    masteryStatus: 'unstudied',
    consecutiveCorrectCount: 0,
    createdAt: now,
    image: input.image,
    audio: input.audio,
    clozeText: input.clozeText,
    occlusions: input.occlusions,
  };
}

export function parseCardsFromText(
  text: string,
  learningSetId?: string,
  learningSetTitle?: string
): ParsedCards {
  const warnings: string[] = [];
  const terms: Term[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const delimiter = trimmed.includes('\t') ? '\t' : trimmed.includes('|') ? '|' : ',';
    const [front, ...rest] = trimmed.split(delimiter);
    const back = rest.join(delimiter);
    if (!front?.trim() || !back?.trim()) {
      warnings.push(`Regel ${index + 1} overgeslagen: verwacht vraag en antwoord.`);
      return;
    }
    const tags = front.includes('#')
      ? front
          .split(/\s+/)
          .filter((part) => part.startsWith('#'))
          .map((part) => part.slice(1))
      : [];
    terms.push(
      newTerm(
        {
          term: front.replace(/\s+#\S+/g, '').trim(),
          definition: back.trim(),
          learningSetId,
          learningSetTitle,
          tags,
        },
        index
      )
    );
  });
  return { terms, warnings };
}

export function parseCardsFromJson(
  text: string,
  learningSetId?: string,
  learningSetTitle?: string
): ParsedCards {
  const warnings: string[] = [];
  try {
    const parsed = JSON.parse(text);
    const cards = Array.isArray(parsed) ? parsed : parsed.cards || parsed.terms || [];
    const terms = cards
      .map((card: any, index: number) => {
        const term = card.term || card.front || card.question;
        const definition = card.definition || card.back || card.answer;
        if (!term || !definition) {
          warnings.push(`Kaart ${index + 1} overgeslagen: ontbrekende vraag of antwoord.`);
          return null;
        }
        return newTerm(
          {
            id: card.id,
            term,
            definition,
            front: card.front,
            back: card.back,
            cardType: card.cardType || card.type || 'basic',
            image: card.image || card.imageUrl,
            audio: card.audio || card.audioUrl,
            tags: card.tags || [],
            clozeText: card.clozeText,
            occlusions: card.occlusions || [],
            learningSetId,
            learningSetTitle,
          },
          index
        );
      })
      .filter(Boolean) as Term[];
    return { terms, warnings };
  } catch (error) {
    return {
      terms: [],
      warnings: [`JSON kon niet worden gelezen: ${getErrorMessage(error, 'onbekende fout')}`],
    };
  }
}

export function exportStudySet(set: StudySet, format: 'json' | 'tsv' | 'csv') {
  if (format === 'json') {
    return JSON.stringify(
      {
        title: set.title,
        description: set.description,
        cards: set.terms.map((term) => ({
          id: term.id,
          front: term.front || term.term,
          back: term.back || term.definition,
          type: term.cardType || 'basic',
          image: term.image,
          audio: term.audio,
          tags: term.tags || [],
          clozeText: term.clozeText,
          occlusions: term.occlusions || [],
        })),
      },
      null,
      2
    );
  }

  const separator = format === 'tsv' ? '\t' : ',';
  const escape = (value: string) => {
    if (format === 'tsv') return value.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
    const clean = value.replace(/"/g, '""');
    return /[",\n]/.test(clean) ? `"${clean}"` : clean;
  };
  return set.terms
    .map((term) =>
      [term.front || term.term, term.back || term.definition].map(escape).join(separator)
    )
    .join('\n');
}
