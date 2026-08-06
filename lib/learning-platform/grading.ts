const PUNCTUATION_REGEX = /[.,!?;:'"()[\]{}«»""''–—\-_/\\]/g;

export interface GradingOptions {
  ignoreAccents?: boolean;
  ignoreCase?: boolean;
  ignorePunctuation?: boolean;
  typoTolerance?: number;
}

export function normalizeForGrading(text: string, options: GradingOptions = {}): string {
  const {
    ignoreAccents = true,
    ignoreCase = true,
    ignorePunctuation = true,
  } = options;

  let normalized = text.trim();
  if (ignoreAccents) normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (ignoreCase) normalized = normalized.toLowerCase();
  if (ignorePunctuation) normalized = normalized.replace(PUNCTUATION_REGEX, "");
  return normalized.replace(/\s+/g, " ");
}

export function levenshteinDistance(a: string, b: string, options: GradingOptions = {}): number {
  const left = normalizeForGrading(a, options);
  const right = normalizeForGrading(b, options);
  if (left === right) return 0;
  const matrix: number[][] = Array.from({ length: left.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= right.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      matrix[i][j] =
        left[i - 1] === right[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[left.length][right.length];
}

export interface GradingResult {
  isCorrect: boolean;
  isTypo: boolean;
  distance: number;
}

const SMART_GRADING_MAX_DISTANCE = 2;

export function evaluateAnswer(
  userInput: string,
  correctAnswer: string,
  useSmartGrading: boolean,
  options: GradingOptions = {}
): GradingResult {
  const normalizedUser = normalizeForGrading(userInput, options);
  const normalizedCorrect = normalizeForGrading(correctAnswer, options);

  if (!normalizedUser) {
    return { isCorrect: false, isTypo: false, distance: Infinity };
  }

  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true, isTypo: false, distance: 0 };
  }

  const distance = levenshteinDistance(userInput, correctAnswer, options);

  if (useSmartGrading && distance <= (options.typoTolerance ?? SMART_GRADING_MAX_DISTANCE)) {
    return { isCorrect: true, isTypo: true, distance };
  }

  return { isCorrect: false, isTypo: false, distance };
}
