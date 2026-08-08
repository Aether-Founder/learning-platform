import { describe, it, expect, beforeEach } from 'vitest';
import {
  createContent,
  getContentById,
  getContentByUserId,
  getPublicContent,
  updateContent,
  deleteContent,
  searchContent,
  getContentByType,
} from '@/lib/content';
import { createTestUser } from '@/test-utils/auth';
import { resetDatabase } from '@/test-utils/db';

describe('content', () => {
  let userId: string;
  let otherUserId: string;

  beforeEach(async () => {
    resetDatabase();
    const user = await createTestUser({ email: 'content@test.local' });
    userId = user.user.id;
    const other = await createTestUser({ email: 'other-content@test.local' });
    otherUserId = other.user.id;
  });

  it('creates content with JSON data', () => {
    const content = createContent(userId, 'Notities', 'notes', { text: 'hello' }, 'Beschrijving', [
      'tag1',
    ]);
    expect(content.id).toBeTruthy();
    expect(content.type).toBe('notes');
    expect(content.data).toEqual({ text: 'hello' });
    expect(content.tags).toEqual(['tag1']);
    expect(content.isPublic).toBe(false);
  });

  it('gets content by id and returns null for missing', () => {
    const content = createContent(userId, 'T', 'notes', {});
    expect(getContentById(content.id)?.title).toBe('T');
    expect(getContentById('ghost')).toBeNull();
  });

  it('lists content per user', () => {
    createContent(userId, 'A', 'notes', {});
    createContent(userId, 'B', 'reference', {});
    createContent(otherUserId, 'C', 'notes', {});
    expect(getContentByUserId(userId)).toHaveLength(2);
  });

  it('returns only public content', () => {
    createContent(userId, 'Public', 'notes', {}, undefined, undefined, true);
    createContent(userId, 'Private', 'notes', {});
    expect(getPublicContent()).toHaveLength(1);
  });

  it('updates content and enforces ownership', () => {
    const content = createContent(userId, 'T', 'notes', {});
    const updated = updateContent(content.id, userId, { title: 'Nieuwe titel', isPublic: true });
    expect(updated?.title).toBe('Nieuwe titel');
    expect(updated?.isPublic).toBe(true);
    expect(updateContent(content.id, otherUserId, { title: 'Stolen' })).toBeNull();
  });

  it('deletes content and enforces ownership', () => {
    const content = createContent(userId, 'T', 'notes', {});
    expect(deleteContent(content.id, otherUserId)).toBe(false);
    expect(deleteContent(content.id, userId)).toBe(true);
    expect(deleteContent(content.id, userId)).toBe(false);
  });

  it('searches content by title', () => {
    createContent(userId, 'Wiskunde aantekeningen', 'notes', {});
    createContent(userId, 'Geschiedenis', 'notes', {});
    const results = searchContent(userId, 'Wiskunde');
    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('Wiskunde');
  });

  it('filters content by type', () => {
    createContent(userId, 'N1', 'notes', {});
    createContent(userId, 'S1', 'study_set', {});
    createContent(userId, 'R1', 'reference', {});
    expect(getContentByType(userId, 'notes')).toHaveLength(1);
    expect(getContentByType(userId, 'study_set')).toHaveLength(1);
  });
});
