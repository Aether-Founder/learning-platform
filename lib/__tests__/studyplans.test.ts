import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStudyPlan,
  getStudyPlanById,
  getStudyPlansByUser,
  getStudyPlansByTestWeek,
  updateStudyPlan,
  deleteStudyPlan,
  createStudySession,
  getStudySessionById,
  getStudySessionsByPlan,
  updateStudySession,
  deleteStudySession,
} from '@/lib/studyplans';
import { createTestUser } from '@/test-utils/auth';
import { resetDatabase } from '@/test-utils/db';
import { createTestWeek } from '@/lib/testweeks';

describe('studyplans', () => {
  let userId: string;
  let testWeekId: string;

  beforeEach(async () => {
    resetDatabase();
    const user = await createTestUser({ email: 'plan@test.local' });
    userId = user.user.id;
    testWeekId = createTestWeek(userId, 'Toetsweek', '2026-01-05', '2026-01-16').id;
  });

  it('creates a study plan', async () => {
    const plan = await createStudyPlan(
      userId,
      testWeekId,
      'Plan A',
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-14T00:00:00Z')
    );
    expect(plan.id).toBeTruthy();
    expect(plan.name).toBe('Plan A');
    expect(plan.userId).toBe(userId);
  });

  it('gets by id and lists per user/testweek', async () => {
    const plan = await createStudyPlan(userId, testWeekId, 'Plan A', new Date(), new Date());
    const other = await createTestUser({ email: 'plan-other@test.local' });
    const otherWeek = createTestWeek(other.user.id, 'TW', '2026-02-01', '2026-02-05');
    await createStudyPlan(other.user.id, otherWeek.id, 'Plan B', new Date(), new Date());
    expect((await getStudyPlanById(plan.id))?.name).toBe('Plan A');
    expect(await getStudyPlanById('ghost')).toBeNull();
    expect(await getStudyPlansByUser(userId)).toHaveLength(1);
    expect(await getStudyPlansByTestWeek(testWeekId)).toHaveLength(1);
  });

  it('updates and deletes a plan', async () => {
    const plan = await createStudyPlan(userId, testWeekId, 'Plan', new Date(), new Date());
    const updated = await updateStudyPlan(plan.id, 'Nieuwe naam', undefined, undefined);
    expect(updated?.name).toBe('Nieuwe naam');
    expect(await deleteStudyPlan(plan.id)).toBe(true);
    expect(await deleteStudyPlan(plan.id)).toBe(false);
  });

  it('manages study sessions', async () => {
    const plan = await createStudyPlan(
      userId,
      testWeekId,
      'Plan',
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-14T00:00:00Z')
    );
    const session = await createStudySession(
      plan.id,
      'subj-1',
      new Date('2026-01-02T10:00:00Z'),
      30,
      ['onderwerp']
    );
    expect(session.completed).toBe(false);
    expect(session.duration).toBe(30);
    expect(session.topics).toEqual(['onderwerp']);

    const sessions = await getStudySessionsByPlan(plan.id);
    expect(sessions).toHaveLength(1);

    const updated = await updateStudySession(session.id, true, 25);
    expect(updated?.completed).toBe(true);
    expect(updated?.actualDuration).toBe(25);

    expect(await getStudySessionById('ghost')).toBeNull();
    expect(await deleteStudySession(session.id)).toBe(true);
    expect(await getStudySessionsByPlan(plan.id)).toHaveLength(0);
  });
});
