import type { Question, QuestionType, StudySettings, Term } from "@/types/learning-platform";
import { fisherYatesShuffle, getPromptAndAnswer } from "./term-filters";

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueByNormalized(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function pickDistractors(
  allTerms: Term[],
  current: Term,
  count: number,
  pickFrom: "term" | "definition"
): string[] {
  const field = pickFrom === "term" ? "term" : "definition";
  const correctValue = current[field].trim().toLowerCase();
  const pool = uniqueByNormalized(
    allTerms
      .filter((t) => t.id !== current.id)
      .map((t) => t[field])
      .filter((value) => value.trim().toLowerCase() !== correctValue)
  );

  return fisherYatesShuffle(pool).slice(0, count);
}

export function buildMcqQuestion(
  term: Term,
  allTerms: Term[],
  settings: StudySettings
): Question {
  const { prompt, answer } = getPromptAndAnswer(term, settings.questionFormat);
  const distractors = pickDistractors(
    allTerms,
    term,
    3,
    settings.questionFormat === "term-to-definition" ? "definition" : "term"
  );
  const options = fisherYatesShuffle(uniqueByNormalized([answer, ...distractors]));
  return {
    id: createId("q"),
    term,
    type: "multiple-choice",
    prompt,
    correctAnswer: answer,
    options,
    startTime: new Date(),
  };
}

export function buildWrittenQuestion(term: Term, settings: StudySettings): Question {
  const { prompt, answer } = getPromptAndAnswer(term, settings.questionFormat);
  return {
    id: createId("q"),
    term,
    type: "written",
    prompt,
    correctAnswer: answer,
    startTime: new Date(),
  };
}

export function buildTrueFalseQuestion(
  term: Term,
  allTerms: Term[],
  settings: StudySettings,
  forceFalse = false
): Question {
  const { prompt, answer } = getPromptAndAnswer(term, settings.questionFormat);
  const distractor = pickDistractors(
    allTerms,
    term,
    1,
    settings.questionFormat === "term-to-definition" ? "definition" : "term"
  )[0];
  const isTrue = !distractor ? true : forceFalse ? false : Math.random() < 0.5;
  const displayedAnswer = isTrue ? answer : distractor ?? answer;
  const statement =
    settings.questionFormat === "term-to-definition"
      ? `${prompt} - ${displayedAnswer}`
      : `${prompt} betekent: ${displayedAnswer}`;

  return {
    id: createId("q"),
    term,
    type: "true-false",
    prompt: statement,
    correctAnswer: isTrue ? "True" : "False",
    options: ["True", "False"],
    startTime: new Date(),
  };
}

export function buildTestQuestions(terms: Term[], allTerms: Term[], settings: StudySettings): Question[] {
  const enabled = new Set(settings.enabledQuestionTypes);
  type TestQuestionType = "true-false" | "multiple-choice" | "written";
  const distribution = settings.testQuestionDistribution ?? {
    "true-false": 25,
    "multiple-choice": 50,
    written: 25,
  };
  const enabledTypes: TestQuestionType[] = (["true-false", "multiple-choice", "written"] as const).filter((type) =>
    enabled.has(type)
  );
  const activeTypes: TestQuestionType[] = enabledTypes.length ? enabledTypes : ["multiple-choice"];
  const totalWeight = activeTypes.reduce((sum, type) => sum + (distribution[type] || 0), 0) || activeTypes.length;
  const quotas = new Map<TestQuestionType, number>();
  let assigned = 0;

  activeTypes.forEach((type, index) => {
    const rawWeight = totalWeight === activeTypes.length ? 1 : distribution[type] || 0;
    const quota =
      index === activeTypes.length - 1
        ? terms.length - assigned
        : Math.round((terms.length * rawWeight) / totalWeight);
    quotas.set(type, quota);
    assigned += quota;
  });

  const typeQueue = fisherYatesShuffle(
    activeTypes.flatMap((type) => Array.from({ length: Math.max(0, quotas.get(type) ?? 0) }, () => type))
  );

  return fisherYatesShuffle(terms).map((term, index) => {
    const type = typeQueue[index] ?? activeTypes[index % activeTypes.length];
    if (type === "true-false") return buildTrueFalseQuestion(term, allTerms, settings, index % 2 === 1);
    if (type === "written") return buildWrittenQuestion(term, settings);
    return buildMcqQuestion(term, allTerms, settings);
  });
}

export function learnQuestionTypeForTerm(
  _term: Term,
  consecutiveCorrect: number
): QuestionType {
  if (consecutiveCorrect >= 2) return "written";
  return "multiple-choice";
}

export function buildLearnQuestion(
  term: Term,
  allTerms: Term[],
  settings: StudySettings,
  consecutiveCorrect: number
): Question {
  const type = learnQuestionTypeForTerm(term, consecutiveCorrect);
  if (type === "written") return buildWrittenQuestion(term, settings);
  return buildMcqQuestion(term, allTerms, settings);
}
