import {
  LegacyUserRepository,
  LegacyStudySetRepository,
  LegacyCardRepository,
  LegacyCalendarRepository,
  LegacyTestWeekRepository,
  LegacyHomeworkRepository,
} from './legacy-adapter';
import {
  IUserRepository,
  IStudySetRepository,
  ICardRepository,
  ICalendarRepository,
  ITestWeekRepository,
  IHomeworkRepository,
} from './types';

export * from './types';

export const userRepository: IUserRepository = new LegacyUserRepository();
export const studySetRepository: IStudySetRepository = new LegacyStudySetRepository();
export const cardRepository: ICardRepository = new LegacyCardRepository();
export const calendarRepository: ICalendarRepository = new LegacyCalendarRepository();
export const testWeekRepository: ITestWeekRepository = new LegacyTestWeekRepository();
export const homeworkRepository: IHomeworkRepository = new LegacyHomeworkRepository();
