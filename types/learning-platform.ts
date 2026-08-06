// Core data types for the comprehensive learning platform

export type MasteryStatus = 'unstudied' | 'learning' | 'review' | 'due' | 'mastered' | 'suspended';

export type QuestionType = 'multiple-choice' | 'written' | 'true-false' | 'flashcard';

export type LearningMode = 'review' | 'flashcard' | 'learn' | 'learn-image' | 'test' | 'multiple-choice-only' | 'writing-only' | 'match' | 'blast' | 'blocks' | 'sprint' | 'type-rush' | 'gravity' | 'samenvatting';

/** Learning activity chosen in session settings (Leren flow) */
export type LerenActivity = 'flashcard' | 'learn' | 'multiple-choice-only' | 'writing-only';

export type CardType = "basic" | "reverse" | "cloze" | "image-occlusion";

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export type SrsAlgorithm = "sm2" | "fsrs";

export type ReviewMode = "due" | "new" | "mix" | "mistakes" | "starred";

export interface ImageOcclusion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

// Term/Definition pair with progress tracking
export interface Term {
  id: string;
  term: string;
  definition: string;
  front?: string;
  back?: string;
  cardType?: CardType;
  tags?: string[];
  clozeText?: string;
  audio?: string;
  occlusions?: ImageOcclusion[];
  suspended?: boolean;
  buriedUntil?: Date;
  learningSetId?: string;
  learningSetTitle?: string;
  isStarred: boolean;
  masteryStatus: MasteryStatus;
  consecutiveCorrectCount: number;
  lastStudied?: Date;
  nextReviewAt?: Date;
  intervalDays?: number;
  easeFactor?: number;
  difficulty?: number;
  stability?: number;
  retrievability?: number;
  reviewCount?: number;
  lapseCount?: number;
  dueState?: ReviewMode | "review" | "mastered";
  createdAt: Date;
  image?: string;
}

export interface LearningSetSummary {
  id: string;
  title: string;
  description?: string;
  termCount: number;
}

// Study set containing multiple terms
export interface StudySet {
  id: string;
  title: string;
  description?: string;
  terms: Term[];
  learningSets: LearningSetSummary[];
  createdAt: Date;
  updatedAt: Date;
}

// User progress tracking for individual terms
export interface UserTermProgress {
  userId: string;
  termId: string;
  status: MasteryStatus;
  consecutiveCorrectCount: number;
  isStarred: boolean;
  totalAttempts: number;
  correctAttempts: number;
  lastAttemptDate?: Date;
  nextReviewAt?: Date;
  intervalDays: number;
  easeFactor: number;
  difficulty: number;
  stability: number;
  retrievability: number;
  reviewCount: number;
  lapseCount: number;
  lastGrade?: ReviewGrade;
  suspended: boolean;
  buriedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Study session tracking
export interface StudySession {
  id: string;
  userId: string;
  studySetId: string;
  mode: LearningMode;
  startTime: Date;
  endTime?: Date;
  totalQuestions: number;
  correctAnswers: number;
  score?: number; // Percentage score for test mode
  settings: StudySettings;
  termResults: TermResult[];
}

// Individual term result within a session
export interface TermResult {
  termId: string;
  questionType: QuestionType;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  wasOverridden: boolean; // User clicked "I was right"
  reviewGrade?: ReviewGrade;
  timeSpent: number; // milliseconds
  timestamp: Date;
}

// User study settings/preferences
export interface StudySettings {
  examDate?: Date;
  roundLength: number | 'all'; // Number of terms per round or 'all'
  enabledQuestionTypes: QuestionType[];
  questionFormat: 'term-to-definition' | 'definition-to-term';
  studyStarredOnly: boolean;
  shuffleTerms: boolean;
  smartGrading: boolean;
  retypeAnswers: boolean;
  reviewMode: ReviewMode;
  dailyNewLimit: number;
  dailyReviewLimit: number;
  srsAlgorithm: SrsAlgorithm;
  gradingIgnoreAccents: boolean;
  gradingIgnoreCase: boolean;
  gradingIgnorePunctuation: boolean;
  gradingTypoTolerance: number;
  testFeedbackMode: 'exam' | 'instant';
  retryIncorrect: boolean;
  // Test mode specific
  testQuestionDistribution?: {
    'true-false': number; // percentage
    'multiple-choice': number;
    'written': number;
  };
  /** Which leren mode to run (set in session settings before start) */
  lerenActivity?: LerenActivity;
  /** Multiple activities enabled for the leren flow. */
  lerenActivities?: LerenActivity[];
  /** Selected paragraph/section learning sets. Empty means all sets. */
  selectedLearningSetIds?: string[];
}

// Question state for active learning session
export interface Question {
  id: string;
  term: Term;
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  options?: string[]; // For MCQ and True/False
  userAnswer?: string;
  isCorrect?: boolean;
  wasOverridden?: boolean;
  startTime: Date;
  endTime?: Date;
}

// Learn mode specific state
export interface LearnModeState {
  unseenTerms: Term[];
  familiarTerms: Term[];
  masteredTerms: Term[];
  currentQuestion?: Question;
  roundComplete: boolean;
}

// Test mode specific state
export interface TestModeState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, string>;
  isComplete: boolean;
  score?: number;
}

// Match game state
export interface MatchGameState {
  tiles: MatchTile[];
  selectedTiles: string[];
  matchedPairs: string[];
  startTime: Date;
  elapsedTime: number;
  isComplete: boolean;
}

export interface MatchTile {
  id: string;
  content: string;
  type: 'term' | 'definition';
  termId: string;
  isMatched: boolean;
  isSelected: boolean;
}

// Blast game state
export interface BlastGameState {
  fallingItems: FallingItem[];
  score: number;
  lives: number;
  speed: number;
  isGameOver: boolean;
  currentInput: string;
}

export interface FallingItem {
  id: string;
  term: Term;
  content: string; // The definition that's falling
  correctAnswer: string; // The term to type
  yPosition: number;
  xPosition: number;
  speed: number;
}

// Blocks game state
export interface BlocksGameState {
  grid: (string | null)[][];
  availableBlocks: BlockShape[];
  score: number;
  isWaitingForQuestion: boolean;
  currentQuestion?: Question;
}

export interface BlockShape {
  id: string;
  pattern: boolean[][];
  color: string;
}

// Analytics data
export interface AnalyticsData {
  studySetId: string;
  totalTerms: number;
  unstudiedCount: number;
  learningCount: number;
  masteredCount: number;
  totalStudyTime: number; // minutes
  averageScore: number;
  recentSessions: StudySession[];
  termBreakdown: {
    termId: string;
    term: string;
    status: MasteryStatus;
    accuracy: number;
    attempts: number;
  }[];
}
