import { User, UserPreferences } from '../auth';
import { StudySet, StudyCard } from '../studysets';
import { CalendarEvent } from '../calendar-events';
import { TestWeek } from '../testweeks';
import { Homework } from '../homework';

export interface IUserRepository {
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updatePreferences(id: string, preferences: Partial<UserPreferences>): Promise<User | null>;
  updateProfile(
    id: string,
    updates: Partial<Pick<User, 'displayName' | 'avatar' | 'school' | 'grade'>>
  ): Promise<User | null>;
}

export interface IStudySetRepository {
  getById(id: string): Promise<StudySet | null>;
  getByUserId(userId: string): Promise<StudySet[]>;
  getPublic(limit?: number, offset?: number): Promise<StudySet[]>;
  create(
    userId: string,
    data: { title: string; description?: string; folderId?: string; isPublic?: boolean }
  ): Promise<StudySet>;
  update(
    id: string,
    updates: Partial<Pick<StudySet, 'title' | 'description' | 'folderId' | 'isPublic'>>
  ): Promise<StudySet | null>;
  delete(id: string): Promise<boolean>;
  search(query: string, userId?: string): Promise<StudySet[]>;
}

export interface ICardRepository {
  getByStudySetId(studySetId: string): Promise<StudyCard[]>;
  getById(cardId: string): Promise<StudyCard | null>;
  addCard(
    studySetId: string,
    data: Omit<StudyCard, 'id' | 'studySetId' | 'createdAt'>
  ): Promise<StudyCard>;
  updateCard(
    cardId: string,
    updates: Partial<Omit<StudyCard, 'id' | 'studySetId' | 'createdAt'>>
  ): Promise<StudyCard | null>;
  deleteCard(cardId: string): Promise<boolean>;
}

export interface ICalendarRepository {
  getEvents(userId: string): Promise<CalendarEvent[]>;
  getEventById(id: string): Promise<CalendarEvent | null>;
  createEvent(
    userId: string,
    data: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<CalendarEvent>;
  updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null>;
  deleteEvent(id: string): Promise<boolean>;
}

export interface ITestWeekRepository {
  getTestWeeks(userId: string): Promise<TestWeek[]>;
  getTestWeekById(id: string): Promise<TestWeek | null>;
  createTestWeek(
    userId: string,
    data: { name: string; startDate: string; endDate: string }
  ): Promise<TestWeek>;
  updateTestWeek(id: string, updates: Partial<TestWeek>): Promise<TestWeek | null>;
  deleteTestWeek(id: string): Promise<boolean>;
}

export interface IHomeworkRepository {
  getHomework(userId: string): Promise<Homework[]>;
  createHomework(
    userId: string,
    item: Omit<Homework, 'id' | 'userId' | 'createdAt' | 'status'>
  ): Promise<Homework>;
  updateHomework(id: string, updates: Partial<Homework>): Promise<Homework | null>;
  deleteHomework(id: string): Promise<boolean>;
}
