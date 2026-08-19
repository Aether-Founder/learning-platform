import { describe, it, expect, beforeEach } from 'vitest';
import {
  createHomework,
  getHomeworkById,
  getHomeworkByUserId,
  getHomeworkByTestWeek,
  updateHomework,
  deleteHomework,
  getPendingHomework,
  getHomeworkBySubject,
} from '@/lib/homework';
import { createTestUser } from '@/test-utils/auth';
import { resetDatabase } from '@/test-utils/db';

describe('homework', () => {
  let userId: string;

  beforeEach(async () => {
    resetDatabase();
    const user = await createTestUser({ email: 'hw@test.local' });
    userId = user.user.id;
  });

  it('creates homework with pending status', async () => {
    const hw = await createHomework(
      userId,
      'Wiskunde opgaven',
      'Paragraaf 3',
      'Wiskunde',
      new Date('2026-01-15T10:00:00Z'),
      'high',
      60,
      undefined,
      undefined
    );
    expect(hw.id).toBeTruthy();
    expect(hw.title).toBe('Wiskunde opgaven');
    expect(hw.status).toBe('pending');
    expect(hw.priority).toBe('high');
    expect(hw.dueDate).toBeInstanceOf(Date);
  });

  it('fetches by id and returns null for missing', async () => {
    const hw = await createHomework(
      userId,
      'T',
      undefined,
      'S',
      new Date(),
      'medium',
      undefined,
      undefined,
      undefined
    );
    expect((await getHomeworkById(hw.id))?.title).toBe('T');
    expect(await getHomeworkById('ghost')).toBeNull();
  });

  it('lists homework per user and test week', async () => {
    const hw = await createHomework(
      userId,
      'A',
      undefined,
      'S',
      new Date('2026-01-10T10:00:00Z'),
      'low',
      undefined,
      'tw-1',
      undefined
    );
    const other = await createTestUser({ email: 'other-hw@test.local' });
    await createHomework(
      other.user.id,
      'B',
      undefined,
      'S',
      new Date(),
      'low',
      undefined,
      undefined,
      undefined
    );
    expect(await getHomeworkByUserId(userId)).toHaveLength(1);
    expect(await getHomeworkByTestWeek('tw-1')).toHaveLength(1);
    expect(await getHomeworkByTestWeek('tw-other')).toHaveLength(0);
  });

  it('updates homework fields and marks completion', async () => {
    const hw = await createHomework(
      userId,
      'T',
      undefined,
      'S',
      new Date(),
      'low',
      undefined,
      undefined,
      undefined
    );
    const updated = await updateHomework(
      hw.id,
      'Nieuwe titel',
      undefined,
      'Natuurkunde',
      undefined,
      undefined,
      'completed',
      undefined
    );
    expect(updated?.title).toBe('Nieuwe titel');
    expect(updated?.subject).toBe('Natuurkunde');
    expect(updated?.status).toBe('completed');
    expect(updated?.completedAt).toBeInstanceOf(Date);
  });

  it('deletes homework', async () => {
    const hw = await createHomework(
      userId,
      'T',
      undefined,
      'S',
      new Date(),
      'low',
      undefined,
      undefined,
      undefined
    );
    expect(await deleteHomework(hw.id)).toBe(true);
    expect(await deleteHomework(hw.id)).toBe(false);
  });

  it('returns pending homework only', async () => {
    const a = await createHomework(
      userId,
      'A',
      undefined,
      'S',
      new Date(),
      'low',
      undefined,
      undefined,
      undefined
    );
    await createHomework(
      userId,
      'B',
      undefined,
      'S',
      new Date(),
      'low',
      undefined,
      undefined,
      undefined
    );
    await updateHomework(
      a.id,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'completed',
      undefined
    );
    const pending = await getPendingHomework(userId);
    expect(pending).toHaveLength(1);
    expect(pending[0].title).toBe('B');
  });

  it('filters by subject', async () => {
    await createHomework(
      userId,
      'M',
      undefined,
      'Wiskunde',
      new Date(),
      'low',
      undefined,
      undefined,
      undefined
    );
    await createHomework(
      userId,
      'N',
      undefined,
      'Natuurkunde',
      new Date(),
      'low',
      undefined,
      undefined,
      undefined
    );
    const results = await getHomeworkBySubject(userId, 'Wiskunde');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('M');
  });
});
