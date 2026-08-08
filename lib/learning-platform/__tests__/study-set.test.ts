import { describe, it, expect } from 'vitest';
import { buildStudySetFromSections } from '@/lib/learning-platform/study-set';

describe('study-set', () => {
  it('returns null when no terms can be built', () => {
    const result = buildStudySetFromSections([{ id: 's1', title: 'Empty' }], 'page-1');
    expect(result).toBeNull();
  });

  it('builds terms from paragraph questions', () => {
    const result = buildStudySetFromSections(
      [
        {
          id: 's1',
          title: 'Hoofdstuk 1',
          paragraphs: [
            {
              id: 'p1',
              title: 'Paragraaf A',
              questions: [
                { id: 'q1', question: 'Wat is X?', answer: 'Y' },
                { id: 'q2', question: 'Wat is Z?', answer: 'W' },
              ],
            },
          ],
        },
      ],
      'page-1'
    );
    expect(result).not.toBeNull();
    expect(result!.terms).toHaveLength(2);
    expect(result!.terms[0].term).toBe('Wat is X?');
    expect(result!.terms[0].definition).toBe('Y');
    expect(result!.learningSets).toHaveLength(1);
    expect(result!.learningSets[0].termCount).toBe(2);
    expect(result!.id).toBe('set-page-1');
  });

  it('builds terms from explicit learningSet.terms', () => {
    const result = buildStudySetFromSections(
      [
        {
          id: 's1',
          title: 'Hoofdstuk 1',
          learningSet: {
            id: 'ls1',
            title: 'Begrippen',
            description: 'Alle begrippen',
            terms: [
              { term: 'alpha', definition: 'A' },
              { term: 'beta', definition: 'B' },
            ],
          },
        },
      ],
      'page-1'
    );
    expect(result).not.toBeNull();
    expect(result!.terms).toHaveLength(2);
    expect(result!.learningSets[0]).toMatchObject({ id: 'ls1', title: 'Begrippen', termCount: 2 });
  });

  it('skips terms without a definition', () => {
    const result = buildStudySetFromSections(
      [
        {
          id: 's1',
          title: 'H1',
          paragraphs: [
            {
              id: 'p1',
              questions: [
                { id: 'q1', question: 'Has answer', answer: 'yes' },
                { id: 'q2', question: 'No answer', answer: '  ' },
              ],
            },
          ],
        },
      ],
      'page-1'
    );
    expect(result!.terms).toHaveLength(1);
  });

  it('handles blocks with question type', () => {
    const result = buildStudySetFromSections(
      [
        {
          id: 's1',
          title: 'H1',
          answers: [{ questionId: 'q-1', answer: 'Block answer' }],
          blocks: [
            {
              type: 'questions',
              questions: [{ id: 'q-1', question: 'Block question' }],
            },
          ],
        },
      ],
      'page-1'
    );
    expect(result!.terms).toHaveLength(1);
    expect(result!.terms[0].term).toBe('Block question');
    expect(result!.terms[0].definition).toBe('Block answer');
  });
});
