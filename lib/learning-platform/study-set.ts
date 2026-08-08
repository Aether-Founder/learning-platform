import type { LearningSetSummary, StudySet, Term } from '@/types/learning-platform';
import { getSectionTitle } from '@/lib/section-title';

interface SourceQuestion {
  id: string;
  number?: string;
  question: string;
  text?: string;
  answer: string;
}

interface SourceTerm {
  id?: string;
  term?: string;
  question?: string;
  definition?: string;
  answer?: string;
}

interface SourceLearningSet {
  id?: string;
  title?: string;
  description?: string;
  terms?: SourceTerm[];
  questionIds?: string[];
  blockIds?: string[];
}

interface SourceParagraph {
  id?: string;
  title?: string;
  questions?: SourceQuestion[];
  learningSet?: SourceLearningSet;
  learningSets?: SourceLearningSet[];
}

interface TextbookBlock {
  type?: string;
  questions?: Array<{ id: string; number?: string; text?: string; question?: string }>;
}

interface TextbookAnswer {
  questionId: string;
  answer: string;
}

interface SourceSection {
  id: string;
  title: string | string[];
  titles?: string[];
  chapterTitles?: string[];
  paragraphs?: SourceParagraph[];
  blocks?: TextbookBlock[];
  answers?: TextbookAnswer[];
  learningSet?: SourceLearningSet;
  learningSets?: SourceLearningSet[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function addLearningSet(
  learningSets: Map<string, LearningSetSummary>,
  id: string,
  title: string,
  description?: string
) {
  if (!learningSets.has(id)) {
    learningSets.set(id, { id, title, description, termCount: 0 });
  }
}

function pushTerm(
  terms: Term[],
  learningSets: Map<string, LearningSetSummary>,
  input: { id?: string; term?: string; definition?: string },
  learningSet: { id: string; title: string; description?: string },
  now: Date
) {
  const term = (input.term || '').trim();
  const definition = (input.definition || '').trim();
  if (!term || !definition) return;

  addLearningSet(learningSets, learningSet.id, learningSet.title, learningSet.description);
  const summary = learningSets.get(learningSet.id);
  if (summary) summary.termCount += 1;

  terms.push({
    id: input.id || `${learningSet.id}-term-${summary?.termCount ?? terms.length + 1}`,
    term,
    definition,
    front: term,
    back: definition,
    cardType: 'basic',
    tags: [],
    learningSetId: learningSet.id,
    learningSetTitle: learningSet.title,
    isStarred: false,
    masteryStatus: 'unstudied',
    consecutiveCorrectCount: 0,
    createdAt: now,
  });
}

function addExplicitLearningSetTerms(
  terms: Term[],
  learningSets: Map<string, LearningSetSummary>,
  rawSet: SourceLearningSet | undefined,
  fallback: { id: string; title: string },
  now: Date
) {
  if (!rawSet?.terms?.length) return;
  const id = rawSet.id || fallback.id;
  const title = rawSet.title || fallback.title;
  rawSet.terms.forEach((item, index) => {
    pushTerm(
      terms,
      learningSets,
      {
        id: item.id || `${id}-term-${index + 1}`,
        term: item.term || item.question,
        definition: item.definition || item.answer,
      },
      { id, title, description: rawSet.description },
      now
    );
  });
}

export function buildStudySetFromSections(
  sections: SourceSection[],
  pageId: string
): StudySet | null {
  const terms: Term[] = [];
  const learningSets = new Map<string, LearningSetSummary>();
  const now = new Date();

  sections.forEach((section) => {
    const sectionTitle = getSectionTitle(section);
    addExplicitLearningSetTerms(
      terms,
      learningSets,
      section.learningSet,
      { id: section.id, title: sectionTitle },
      now
    );
    (section.learningSets || []).forEach((set, index) =>
      addExplicitLearningSetTerms(
        terms,
        learningSets,
        set,
        { id: set.id || `${section.id}-set-${index + 1}`, title: set.title || sectionTitle },
        now
      )
    );

    (section.paragraphs || []).forEach((paragraph) => {
      const fallbackSet = {
        id: paragraph.id || `${section.id}-paragraph-${slugify(paragraph.title || 'set')}`,
        title: paragraph.title || sectionTitle,
      };
      addExplicitLearningSetTerms(terms, learningSets, paragraph.learningSet, fallbackSet, now);
      (paragraph.learningSets || []).forEach((set, index) =>
        addExplicitLearningSetTerms(
          terms,
          learningSets,
          set,
          {
            id: set.id || `${fallbackSet.id}-set-${index + 1}`,
            title: set.title || fallbackSet.title,
          },
          now
        )
      );

      (paragraph.questions || []).forEach((q) => {
        pushTerm(
          terms,
          learningSets,
          {
            id: q.id || `term-${terms.length}`,
            term: q.question || q.text,
            definition: q.answer,
          },
          fallbackSet,
          now
        );
      });
    });

    const answerMap = new Map((section.answers || []).map((a) => [a.questionId, a.answer]));
    (section.blocks || [])
      .filter((b) => b.type === 'questions')
      .forEach((block) => {
        const blockSet = {
          id: block.questions?.[0]?.id
            ? `${section.id}-${slugify(block.questions[0].id.replace(/-q.*/, ''))}`
            : block.type
              ? `${section.id}-${block.type}`
              : section.id,
          title: sectionTitle,
        };
        (block.questions || []).forEach((q) => {
          const prompt = (q.question || q.text || '').trim();
          const answer = (answerMap.get(q.id) || '').trim();
          pushTerm(
            terms,
            learningSets,
            { id: q.id || `term-${terms.length}`, term: prompt, definition: answer },
            blockSet,
            now
          );
        });
      });
  });

  if (terms.length === 0) return null;

  return {
    id: `set-${pageId}`,
    title: sections.length === 1 ? getSectionTitle(sections[0]) : 'Oefenmateriaal',
    description: `${terms.length} begrippen`,
    terms,
    learningSets: Array.from(learningSets.values()).filter((set) => set.termCount > 0),
    createdAt: now,
    updatedAt: now,
  };
}
