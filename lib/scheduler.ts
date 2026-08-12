import { addDays, differenceInDays, isWeekend, setHours, setMinutes } from 'date-fns';

interface StudySession {
  id: string;
  studyPlanId: string;
  studySetId: string;
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'skipped';
}

interface StudyPlan {
  id: string;
  title: string;
  goalType: 'exam' | 'daily' | 'custom';
  targetDate?: Date;
  dailyGoalMinutes: number;
  preferredTimes: string[];
  studySetIds: string[];
}

interface StudySet {
  id: string;
  title: string;
  cardCount: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  lastStudied?: Date;
}

export class StudyScheduler {
  /**
   * Generate study sessions based on a study plan
   */
  static generateSessions(
    plan: StudyPlan,
    studySets: StudySet[],
    startDate: Date = new Date()
  ): StudySession[] {
    if (plan.goalType === 'daily') {
      return this.generateDailySessions(plan, studySets, startDate);
    } else if (plan.goalType === 'exam' && plan.targetDate) {
      return this.generateExamSessions(plan, studySets, startDate, plan.targetDate);
    } else {
      return this.generateCustomSessions(plan, studySets, startDate);
    }
  }

  /**
   * Generate daily recurring sessions
   */
  private static generateDailySessions(
    plan: StudyPlan,
    studySets: StudySet[],
    startDate: Date
  ): StudySession[] {
    const sessions: StudySession[] = [];
    const daysToGenerate = 30; // Generate 30 days ahead

    for (let i = 0; i < daysToGenerate; i++) {
      const date = addDays(startDate, i);

      // Skip weekends if not preferred
      if (isWeekend(date) && !plan.preferredTimes.some((t) => t.includes('Weekend'))) {
        continue;
      }

      const timeSlots = this.getTimeSlotsForDate(date, plan.preferredTimes);

      for (const timeSlot of timeSlots) {
        const studySet = this.selectStudySet(studySets, sessions);
        if (!studySet) continue;

        sessions.push({
          id: `session-${Date.now()}-${i}-${sessions.length}`,
          studyPlanId: plan.id,
          studySetId: studySet.id,
          scheduledDate: date,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          durationMinutes: plan.dailyGoalMinutes,
          status: 'scheduled',
        });
      }
    }

    return sessions;
  }

  /**
   * Generate sessions leading up to an exam
   */
  private static generateExamSessions(
    plan: StudyPlan,
    studySets: StudySet[],
    startDate: Date,
    targetDate: Date
  ): StudySession[] {
    const sessions: StudySession[] = [];
    const totalDays = differenceInDays(targetDate, startDate);

    if (totalDays <= 0) return sessions;

    // Calculate total study time needed
    const sessionsPerDay = Math.ceil(plan.dailyGoalMinutes / 60);

    // Distribute study sets across the period
    const studySetDistribution = this.distributeStudySets(studySets, totalDays);

    for (let day = 0; day < totalDays; day++) {
      const date = addDays(startDate, day);

      // Skip weekends if not preferred
      if (isWeekend(date) && !plan.preferredTimes.some((t) => t.includes('Weekend'))) {
        continue;
      }

      const timeSlots = this.getTimeSlotsForDate(date, plan.preferredTimes);

      for (let slotIndex = 0; slotIndex < Math.min(timeSlots.length, sessionsPerDay); slotIndex++) {
        const studySetIndex = studySetDistribution[day % studySetDistribution.length];
        const studySet = studySets[studySetIndex];

        if (!studySet) continue;

        const timeSlot = timeSlots[slotIndex];

        sessions.push({
          id: `session-${Date.now()}-${day}-${slotIndex}`,
          studyPlanId: plan.id,
          studySetId: studySet.id,
          scheduledDate: date,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          durationMinutes: Math.min(60, plan.dailyGoalMinutes),
          status: 'scheduled',
        });
      }
    }

    return sessions;
  }

  /**
   * Generate custom sessions based on user preferences
   */
  private static generateCustomSessions(
    plan: StudyPlan,
    studySets: StudySet[],
    startDate: Date
  ): StudySession[] {
    const sessions: StudySession[] = [];
    const daysToGenerate = 14; // Generate 2 weeks ahead

    for (let i = 0; i < daysToGenerate; i++) {
      const date = addDays(startDate, i);

      const timeSlots = this.getTimeSlotsForDate(date, plan.preferredTimes);

      for (const timeSlot of timeSlots) {
        const studySet = this.selectStudySet(studySets, sessions);
        if (!studySet) continue;

        sessions.push({
          id: `session-${Date.now()}-${i}-${sessions.length}`,
          studyPlanId: plan.id,
          studySetId: studySet.id,
          scheduledDate: date,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          durationMinutes: plan.dailyGoalMinutes,
          status: 'scheduled',
        });
      }
    }

    return sessions;
  }

  /**
   * Get available time slots for a date based on preferences
   */
  private static getTimeSlotsForDate(
    date: Date,
    preferredTimes: string[]
  ): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = [];

    if (preferredTimes.length === 0) {
      // Default to evening if no preference
      const start = setHours(setMinutes(date, 0), 18);
      const end = setHours(setMinutes(date, 0), 19);
      slots.push({ start, end });
      return slots;
    }

    for (const time of preferredTimes) {
      let startHour = 9;
      let endHour = 10;

      if (time.includes('Ochtend')) {
        startHour = 7;
        endHour = 8;
      } else if (time.includes('Middag')) {
        startHour = 12;
        endHour = 13;
      } else if (time.includes('Avond')) {
        startHour = 18;
        endHour = 19;
      } else if (time.includes('Nacht')) {
        startHour = 20;
        endHour = 21;
      }

      const start = setHours(setMinutes(date, 0), startHour);
      const end = setHours(setMinutes(date, 0), endHour);
      slots.push({ start, end });
    }

    return slots;
  }

  /**
   * Select a study set based on rotation and priority
   */
  private static selectStudySet(
    studySets: StudySet[],
    existingSessions: StudySession[]
  ): StudySet | null {
    if (studySets.length === 0) return null;

    // Count how many times each study set has been scheduled
    const counts = studySets.map((set) => ({
      set,
      count: existingSessions.filter((s) => s.studySetId === set.id).length,
    }));

    // Sort by count (ascending) to rotate through sets
    counts.sort((a, b) => a.count - b.count);

    // Prioritize sets that haven't been studied recently
    const leastStudied = counts.filter((c) => c.count === counts[0].count);

    if (leastStudied.length > 1) {
      // Among equally scheduled sets, pick the one studied longest ago
      leastStudied.sort((a, b) => {
        const aLast = a.set.lastStudied?.getTime() || 0;
        const bLast = b.set.lastStudied?.getTime() || 0;
        return aLast - bLast;
      });
    }

    return leastStudied[0]?.set || studySets[0];
  }

  /**
   * Distribute study sets across days for exam preparation
   */
  private static distributeStudySets(studySets: StudySet[], totalDays: number): number[] {
    const distribution: number[] = [];

    // Weight by difficulty and card count
    const weights = studySets.map((set, index) => {
      let weight = set.cardCount;
      if (set.difficulty === 'hard') weight *= 1.5;
      if (set.difficulty === 'medium') weight *= 1.2;
      return { index, weight };
    });

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

    for (let day = 0; day < totalDays; day++) {
      const random = Math.random() * totalWeight;
      let cumulative = 0;

      for (const w of weights) {
        cumulative += w.weight;
        if (random <= cumulative) {
          distribution.push(w.index);
          break;
        }
      }

      // Fallback if no match
      if (distribution.length <= day) {
        distribution.push(0);
      }
    }

    return distribution;
  }

  /**
   * Reschedule a session to a new time
   */
  static rescheduleSession(session: StudySession, newDate: Date, newStartTime: Date): StudySession {
    const duration = session.durationMinutes;
    const newEndTime = new Date(newStartTime.getTime() + duration * 60000);

    return {
      ...session,
      scheduledDate: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
    };
  }

  /**
   * Adjust schedule based on completed sessions
   */
  static adjustSchedule(sessions: StudySession[], completedSessionIds: string[]): StudySession[] {
    return sessions.map((session) => {
      if (completedSessionIds.includes(session.id)) {
        return { ...session, status: 'completed' as const };
      }
      return session;
    });
  }
}
