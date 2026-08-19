/**
 * Semantic grading for study modes
 * Uses fuzzy matching and string similarity to grade answers
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j], // deletion
            dp[i][j - 1], // insertion
            dp[i - 1][j - 1] // substitution
          );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  if (maxLength === 0) return 1;

  return 1 - distance / maxLength;
}

/**
 * Check if answer is semantically correct with tolerance
 */
export function isSemanticallyCorrect(
  userAnswer: string,
  correctAnswer: string,
  threshold: number = 0.8
): boolean {
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  return similarity >= threshold;
}

/**
 * Grade an answer and return detailed feedback
 */
export interface GradingResult {
  correct: boolean;
  similarity: number;
  feedback: string;
  suggestions?: string[];
}

export function gradeAnswer(
  userAnswer: string,
  correctAnswer: string,
  threshold: number = 0.8
): GradingResult {
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  const correct = similarity >= threshold;

  let feedback: string;
  let suggestions: string[] = [];

  if (correct) {
    if (similarity === 1) {
      feedback = 'Perfect!';
    } else if (similarity > 0.95) {
      feedback = 'Excellent! Minor spelling difference.';
    } else {
      feedback = 'Correct! Close enough.';
    }
  } else {
    if (similarity > 0.6) {
      feedback = 'Close, but not quite right.';
      suggestions = ['Check your spelling', 'Review the exact wording'];
    } else if (similarity > 0.3) {
      feedback = 'Partially correct.';
      suggestions = ['Review the key concepts', 'Try to be more specific'];
    } else {
      feedback = 'Incorrect.';
      suggestions = ['Review the material', 'Focus on the main idea'];
    }
  }

  return {
    correct,
    similarity,
    feedback,
    suggestions,
  };
}

/**
 * Extract key terms from an answer for partial credit
 */
export function extractKeyTerms(answer: string): string[] {
  // Remove common stop words and extract meaningful terms
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'shall',
    'can',
    'to',
    'of',
    'in',
    'for',
    'on',
    'with',
    'at',
    'by',
    'from',
    'as',
    'into',
    'through',
    'during',
    'before',
    'after',
    'above',
    'below',
    'between',
    'under',
    'again',
    'further',
    'then',
    'once',
    'here',
    'there',
    'when',
    'where',
    'why',
    'how',
    'all',
    'each',
    'few',
    'more',
    'most',
    'other',
    'some',
    'such',
    'no',
    'nor',
    'not',
    'only',
    'own',
    'same',
    'so',
    'than',
    'too',
    'very',
    'just',
    'and',
    'but',
    'if',
    'or',
    'because',
    'as',
    'until',
    'while',
    'of',
    'at',
    'by',
    'for',
    'with',
    'about',
    'against',
    'between',
    'into',
    'through',
    'during',
    'before',
    'after',
    'above',
    'below',
    'to',
    'from',
    'up',
    'down',
    'in',
    'out',
    'on',
    'off',
    'over',
    'under',
    'again',
    'further',
    'then',
    'once',
  ]);

  const words = answer
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return [...new Set(words)]; // Remove duplicates
}

/**
 * Check if key terms from correct answer are present in user answer
 */
export function hasKeyTerms(
  userAnswer: string,
  correctAnswer: string,
  minTerms: number = 1
): boolean {
  const userTerms = extractKeyTerms(userAnswer);
  const correctTerms = extractKeyTerms(correctAnswer);

  const matchingTerms = correctTerms.filter((term) => userTerms.includes(term));

  return matchingTerms.length >= minTerms;
}

/**
 * Grade answer with partial credit based on key terms
 */
export function gradeWithPartialCredit(userAnswer: string, correctAnswer: string): GradingResult {
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  const hasTerms = hasKeyTerms(userAnswer, correctAnswer, 1);

  let correct: boolean;
  let feedback: string;
  let suggestions: string[] = [];

  if (similarity >= 0.8) {
    correct = true;
    feedback = similarity === 1 ? 'Perfect!' : 'Correct!';
  } else if (hasTerms) {
    correct = true;
    feedback = 'Partially correct - you included key terms.';
    suggestions = ['Try to be more precise with your wording'];
  } else {
    correct = false;
    feedback = 'Incorrect.';
    suggestions = ['Review the key concepts', 'Include the main terms'];
  }

  return {
    correct,
    similarity,
    feedback,
    suggestions,
  };
}
