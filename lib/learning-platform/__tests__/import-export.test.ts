import { describe, it, expect } from 'vitest';
import {
  parseCardsFromText,
  parseCardsFromJson,
  exportStudySet,
} from '@/lib/learning-platform/import-export';
import type { StudySet } from '@/types/learning-platform';

function makeStudySet(overrides?: Partial<StudySet>): StudySet {
  return {
    id: 'set-1',
    title: 'Test Set',
    description: 'desc',
    learningSets: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    terms: [
      {
        id: 't1',
        term: 'front1',
        definition: 'back1',
        isStarred: false,
        masteryStatus: 'unstudied',
        consecutiveCorrectCount: 0,
        createdAt: new Date(),
      },
      {
        id: 't2',
        term: 'front2',
        definition: 'back2',
        isStarred: false,
        masteryStatus: 'unstudied',
        consecutiveCorrectCount: 0,
        createdAt: new Date(),
      },
    ],
    ...overrides,
  };
}

describe('import-export', () => {
  describe('parseCardsFromText', () => {
    it('parses tab-separated lines', () => {
      const { terms, warnings } = parseCardsFromText('vraag1\tantwoord1\nvraag2\tantwoord2');
      expect(terms).toHaveLength(2);
      expect(warnings).toHaveLength(0);
      expect(terms[0]).toMatchObject({ term: 'vraag1', definition: 'antwoord1' });
    });

    it('parses pipe-separated lines when no tabs', () => {
      const { terms } = parseCardsFromText('a | b\nc | d');
      expect(terms).toHaveLength(2);
      expect(terms[0].term).toBe('a');
      expect(terms[0].definition).toBe('b');
    });

    it('skips malformed lines with a warning', () => {
      const { terms, warnings } = parseCardsFromText('valid\tpair\nbroken-line');
      expect(terms).toHaveLength(1);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('Regel 2');
    });

    it('extracts hash tags from the front', () => {
      const { terms } = parseCardsFromText('term #math #easy\tdef');
      expect(terms[0].tags).toEqual(['math', 'easy']);
      expect(terms[0].term).toBe('term');
    });

    it('attaches learning set metadata', () => {
      const { terms } = parseCardsFromText('a\tb', 'ls-1', 'Set Title');
      expect(terms[0].learningSetId).toBe('ls-1');
      expect(terms[0].learningSetTitle).toBe('Set Title');
    });
  });

  describe('parseCardsFromJson', () => {
    it('parses an array of cards', () => {
      const { terms, warnings } = parseCardsFromJson(
        JSON.stringify([
          { term: 'a', definition: 'b' },
          { front: 'c', back: 'd' },
        ])
      );
      expect(terms).toHaveLength(2);
      expect(warnings).toHaveLength(0);
    });

    it('parses a wrapped cards object', () => {
      const { terms } = parseCardsFromJson(
        JSON.stringify({ cards: [{ question: 'q', answer: 'a' }] })
      );
      expect(terms).toHaveLength(1);
      expect(terms[0].term).toBe('q');
      expect(terms[0].definition).toBe('a');
    });

    it('skips cards missing term or definition', () => {
      const { terms, warnings } = parseCardsFromJson(
        JSON.stringify([{ term: 'ok', definition: 'fine' }, { term: 'no-def' }])
      );
      expect(terms).toHaveLength(1);
      expect(warnings).toHaveLength(1);
    });

    it('returns empty with a warning for invalid JSON', () => {
      const { terms, warnings } = parseCardsFromJson('not json at all');
      expect(terms).toHaveLength(0);
      expect(warnings[0]).toContain('JSON');
    });
  });

  describe('exportStudySet', () => {
    it('exports JSON with cards array', () => {
      const out = exportStudySet(makeStudySet(), 'json');
      const parsed = JSON.parse(out);
      expect(parsed.title).toBe('Test Set');
      expect(parsed.cards).toHaveLength(2);
    });

    it('exports TSV', () => {
      const out = exportStudySet(makeStudySet(), 'tsv');
      expect(out).toBe('front1\tback1\nfront2\tback2');
    });

    it('exports CSV with quoting for commas', () => {
      const set = makeStudySet({
        terms: [
          {
            id: 't1',
            term: 'front, with comma',
            definition: 'back',
            isStarred: false,
            masteryStatus: 'unstudied',
            consecutiveCorrectCount: 0,
            createdAt: new Date(),
          },
        ],
      });
      const out = exportStudySet(set, 'csv');
      expect(out).toBe('"front, with comma",back');
    });
  });
});
