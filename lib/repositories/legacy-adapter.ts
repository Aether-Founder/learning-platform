import {
  IUserRepository,
  IStudySetRepository,
  ICardRepository,
  ICalendarRepository,
  ITestWeekRepository,
  IHomeworkRepository,
} from './types';
import * as legacyAuth from '../auth';
import * as legacyStudySets from '../studysets';
import * as legacyCalendar from '../calendar-events';
import * as legacyTestWeeks from '../testweeks';
import * as legacyHomework from '../homework';
import { logger } from '../logger';

export class LegacyUserRepository implements IUserRepository {
  async getUserById(id: string) {
    logger.debug('LegacyUserRepository.getUserById', { id });
    return legacyAuth.getUserById(id);
  }
  async getUserByEmail(email: string) {
    logger.debug('LegacyUserRepository.getUserByEmail', { email });
    return legacyAuth.getUserByEmail(email);
  }
  async updatePreferences(id: string, preferences: any) {
    logger.info('LegacyUserRepository.updatePreferences', { id, preferences });
    const user = legacyAuth.getUserById(id);
    if (!user) return null;
    return legacyAuth.updateUserProfile(id, {
      preferences: { ...user.preferences, ...preferences },
    });
  }
  async updateProfile(id: string, updates: any) {
    logger.info('LegacyUserRepository.updateProfile', { id, updates });
    return legacyAuth.updateUserProfile(id, updates);
  }
}

export class LegacyStudySetRepository implements IStudySetRepository {
  async getById(id: string) {
    logger.debug('LegacyStudySetRepository.getById', { id });
    return legacyStudySets.getStudySetById(id);
  }
  async getByUserId(userId: string) {
    logger.debug('LegacyStudySetRepository.getByUserId', { userId });
    return legacyStudySets.getStudySetsByUserId(userId);
  }
  async getPublic(limit = 50, offset = 0) {
    return legacyStudySets.getPublicStudySets(limit, offset);
  }
  async create(userId: string, data: { title: string; description?: string; folderId?: string; isPublic?: boolean }) {
    return legacyStudySets.createStudySet(userId, data.title, data.description, data.folderId, data.isPublic ?? false);
  }
  async update(id: string, updates: any) {
    return legacyStudySets.updateStudySet(id, updates);
  }
  async delete(id: string) {
    return legacyStudySets.deleteStudySet(id);
  }
  async search(query: string, userId?: string) {
    return legacyStudySets.searchStudySets(query, userId);
  }
}

export class LegacyCardRepository implements ICardRepository {
  async getByStudySetId(studySetId: string) {
    return legacyStudySets.getStudyCardsByStudySetId(studySetId);
  }
  async getById(cardId: string) {
    return legacyStudySets.getStudyCardById(cardId);
  }
  async addCard(studySetId: string, data: any) {
    return legacyStudySets.addStudyCard(studySetId, data.term || data.front || '', data.definition || data.back || '', data.imageUrl, data);
  }
  async updateCard(cardId: string, updates: any) {
    return legacyStudySets.updateStudyCard(cardId, updates);
  }
  async deleteCard(cardId: string) {
    return legacyStudySets.deleteStudyCard(cardId);
  }
}

export class LegacyCalendarRepository implements ICalendarRepository {
  async getEvents(userId: string) {
    return legacyCalendar.getCalendarEventsByUserId(userId);
  }
  async getEventById(id: string) {
    return legacyCalendar.getCalendarEventById(id);
  }
  async createEvent(userId: string, data: any) {
    return legacyCalendar.createCalendarEvent(userId, data);
  }
  async updateEvent(id: string, updates: any) {
    return legacyCalendar.updateCalendarEvent(id, updates);
  }
  async deleteEvent(id: string) {
    return legacyCalendar.deleteCalendarEvent(id);
  }
}

export class LegacyTestWeekRepository implements ITestWeekRepository {
  async getTestWeeks(userId: string) {
    return legacyTestWeeks.getTestWeeksByUserId(userId);
  }
  async getTestWeekById(id: string) {
    return legacyTestWeeks.getTestWeekById(id);
  }
  async createTestWeek(userId: string, data: { name: string; startDate: string; endDate: string }) {
    return legacyTestWeeks.createTestWeek(userId, data.name, data.startDate, data.endDate);
  }
  async updateTestWeek(id: string, updates: any) {
    return legacyTestWeeks.updateTestWeek(id, updates);
  }
  async deleteTestWeek(id: string) {
    return legacyTestWeeks.deleteTestWeek(id);
  }
}

export class LegacyHomeworkRepository implements IHomeworkRepository {
  async getHomework(userId: string) {
    return legacyHomework.getHomeworkByUserId(userId);
  }
  async createHomework(userId: string, item: any) {
    return legacyHomework.createHomework(
      userId,
      item.title,
      item.description,
      item.subject,
      item.dueDate,
      item.priority,
      item.estimatedTime,
      item.testWeekId,
      item.relatedStudySetId
    );
  }
  async updateHomework(id: string, updates: any) {
    return legacyHomework.updateHomework(
      id,
      updates.title,
      updates.description,
      updates.subject,
      updates.dueDate,
      updates.priority,
      updates.status,
      updates.estimatedTime
    );
  }
  async deleteHomework(id: string) {
    return legacyHomework.deleteHomework(id);
  }
}
