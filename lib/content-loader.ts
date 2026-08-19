import fs from 'fs';
import path from 'path';

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  level: string;
  mastery: number;
  topics: number;
  topics_done: number;
  due_count: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  order: number;
  paragraphs?: string[];
  content?: string;
}

export interface LearningSet {
  id: string;
  chapterId: string;
  subjectId: string;
  title: string;
  description: string;
  cards: Array<{
    front: string;
    back: string;
    source_text?: string;
  }>;
}

export interface Quiz {
  id: string;
  chapterId: string;
  subjectId: string;
  title: string;
  description: string;
  questions: Array<{
    type: 'multiple_choice' | 'open';
    question: string;
    options?: string[];
    correct_answer?: number;
    model_answer?: string;
    explanation?: string;
  }>;
}

export interface Summary {
  id: string;
  chapterId: string;
  subjectId: string;
  title: string;
  content: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PracticeTest {
  id: string;
  chapterId: string;
  subjectId: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  questions: Array<{
    type: string;
    question: string;
    options?: string[];
    correct_answer?: number;
    points: number;
  }>;
}

const CONTENT_DIR = path.join(process.cwd(), 'content');

export async function loadSubject(subjectId: string): Promise<Subject | null> {
  try {
    const filePath = path.join(CONTENT_DIR, 'subjects', subjectId, 'subject.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading subject ${subjectId}:`, error);
    return null;
  }
}

export async function loadChapters(subjectId: string): Promise<Chapter[]> {
  try {
    const chaptersDir = path.join(CONTENT_DIR, 'subjects', subjectId, 'chapters');
    const chapterDirs = fs.readdirSync(chaptersDir);

    const chapters: Chapter[] = [];
    for (const chapterDir of chapterDirs) {
      const chapterPath = path.join(chaptersDir, chapterDir, 'chapter.json');
      const content = fs.readFileSync(chapterPath, 'utf-8');
      chapters.push(JSON.parse(content));
    }

    return chapters.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error(`Error loading chapters for subject ${subjectId}:`, error);
    return [];
  }
}

export async function loadLearningSet(
  subjectId: string,
  chapterId: string,
  learningSetId: string
): Promise<LearningSet | null> {
  try {
    const filePath = path.join(
      CONTENT_DIR,
      'subjects',
      subjectId,
      'chapters',
      chapterId,
      'learning-sets',
      `${learningSetId}.json`
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading learning set ${learningSetId}:`, error);
    return null;
  }
}

export async function loadQuiz(
  subjectId: string,
  chapterId: string,
  quizId: string
): Promise<Quiz | null> {
  try {
    const filePath = path.join(
      CONTENT_DIR,
      'subjects',
      subjectId,
      'chapters',
      chapterId,
      'quizzes',
      `${quizId}.json`
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading quiz ${quizId}:`, error);
    return null;
  }
}

export async function loadSummary(
  subjectId: string,
  chapterId: string,
  summaryId: string
): Promise<Summary | null> {
  try {
    const filePath = path.join(
      CONTENT_DIR,
      'subjects',
      subjectId,
      'chapters',
      chapterId,
      'summaries',
      `${summaryId}.json`
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading summary ${summaryId}:`, error);
    return null;
  }
}

export async function loadPracticeTest(
  subjectId: string,
  chapterId: string,
  testId: string
): Promise<PracticeTest | null> {
  try {
    const filePath = path.join(
      CONTENT_DIR,
      'subjects',
      subjectId,
      'chapters',
      chapterId,
      'practice-tests',
      `${testId}.json`
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading practice test ${testId}:`, error);
    return null;
  }
}
