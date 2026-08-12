import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStudySet,
  getStudySetById,
  getStudySetsByUserId,
  getPublicStudySets,
  updateStudySet,
  deleteStudySet,
  addStudyCard,
  getStudyCardsByStudySetId,
  updateStudyCard,
  getStudyCardById,
  deleteStudyCard,
  searchStudySets,
} from '@/lib/studysets';
import { createTestUser } from '@/test-utils/auth';
import { resetDatabase, db } from '@/test-utils/db';

describe('studysets', () => {
  let userId: string;

  beforeEach(async () => {
    resetDatabase();
    const user = await createTestUser({ email: 'sets@test.local' });
    userId = user.user.id;
  });

  describe('createStudySet', () => {
    it('creates a private study set by default', () => {
      const set = createStudySet(userId, 'Mijn set');
      expect(set.id).toBeTruthy();
      expect(set.userId).toBe(userId);
      expect(set.title).toBe('Mijn set');
      expect(set.isPublic).toBe(false);
      expect(set.cards).toEqual([]);
    });
    it('creates a public study set when requested', () => {
      const set = createStudySet(userId, 'Publiek', undefined, undefined, true);
      expect(set.isPublic).toBe(true);
    });
  });

  describe('getStudySetById', () => {
    it('returns the study set with cards', () => {
      const set = createStudySet(userId, 'Met kaarten');
      addStudyCard(set.id, 'term', 'def');
      const found = getStudySetById(set.id);
      expect(found).not.toBeNull();
      expect(found!.cards).toHaveLength(1);
      expect(found!.cards[0].term).toBe('term');
    });
    it('returns null for missing set', () => {
      expect(getStudySetById('ghost')).toBeNull();
    });
  });

  describe('getStudySetsByUserId', () => {
    it('returns only the user study sets', async () => {
      createStudySet(userId, 'Set 1');
      createStudySet(userId, 'Set 2');
      const other = await createTestUser({ email: 'other@test.local' });
      createStudySet(other.user.id, 'Set 3');
      const sets = getStudySetsByUserId(userId);
      expect(sets).toHaveLength(2);
      expect(sets.map((s) => s.title).sort()).toEqual(['Set 1', 'Set 2']);
    });
  });

  describe('getPublicStudySets', () => {
    it('returns only public sets with pagination', () => {
      createStudySet(userId, 'Public 1', undefined, undefined, true);
      createStudySet(userId, 'Public 2', undefined, undefined, true);
      createStudySet(userId, 'Private 1');
      const all = getPublicStudySets();
      expect(all).toHaveLength(2);
      const limited = getPublicStudySets(1, 0);
      expect(limited).toHaveLength(1);
    });
  });

  describe('updateStudySet', () => {
    it('updates fields', () => {
      const set = createStudySet(userId, 'Origineel');
      const updated = updateStudySet(set.id, { title: 'Nieuw', isPublic: true });
      expect(updated?.title).toBe('Nieuw');
      expect(updated?.isPublic).toBe(true);
    });
    it('returns null for missing set', () => {
      expect(updateStudySet('ghost', { title: 'x' })).toBeNull();
    });
  });

  describe('deleteStudySet', () => {
    it('deletes the set and its cards', () => {
      const set = createStudySet(userId, 'Te verwijderen');
      addStudyCard(set.id, 't', 'd');
      expect(deleteStudySet(set.id)).toBe(true);
      expect(getStudySetById(set.id)).toBeNull();
      expect(getStudyCardsByStudySetId(set.id)).toEqual([]);
    });
    it('returns false for missing set', () => {
      expect(deleteStudySet('ghost')).toBe(false);
    });
  });

  describe('cards', () => {
    it('adds and lists cards', () => {
      const set = createStudySet(userId, 'Cards');
      addStudyCard(set.id, 'a', 'b');
      addStudyCard(set.id, 'c', 'd', 'img.png', { tags: ['x'] });
      const cards = getStudyCardsByStudySetId(set.id);
      expect(cards).toHaveLength(2);
      expect(cards[0].term).toBe('a');
      expect(cards[1].imageUrl).toBe('img.png');
      expect(cards[1].tags).toEqual(['x']);
    });
    it('updates a card', () => {
      const set = createStudySet(userId, 'Cards');
      const card = addStudyCard(set.id, 'a', 'b');
      const updated = updateStudyCard(card.id, { term: 'a2', definition: 'b2' });
      expect(updated?.term).toBe('a2');
      expect(updated?.definition).toBe('b2');
      expect(getStudyCardById(card.id)?.term).toBe('a2');
    });
    it('deletes a card', () => {
      const set = createStudySet(userId, 'Cards');
      const card = addStudyCard(set.id, 'a', 'b');
      expect(deleteStudyCard(card.id)).toBe(true);
      expect(getStudyCardById(card.id)).toBeNull();
      expect(deleteStudyCard(card.id)).toBe(false);
    });
    it('reads legacy terms JSON when no card rows exist', () => {
      const set = createStudySet(userId, 'Legacy');
      const now = new Date().toISOString();
      db.prepare('UPDATE study_sets SET terms = ? WHERE id = ?').run(
        JSON.stringify([
          { id: 'l1', term: 'old', definition: 'legacy', createdAt: now },
        ]),
        set.id
      );
      const cards = getStudyCardsByStudySetId(set.id);
      expect(cards).toHaveLength(1);
      expect(cards[0].term).toBe('old');
    });
  });

  describe('searchStudySets', () => {
    it('searches within a user scope', () => {
      createStudySet(userId, 'Frans vocabulaire');
      createStudySet(userId, 'Engels vocabulaire');
      const results = searchStudySets('Frans', userId);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Frans vocabulaire');
    });
    it('searches public sets without a user', () => {
      createStudySet(userId, 'Openbaar Frans', undefined, undefined, true);
      createStudySet(userId, 'Privé Frans');
      const results = searchStudySets('Frans');
      expect(results).toHaveLength(1);
    });
  });
});
