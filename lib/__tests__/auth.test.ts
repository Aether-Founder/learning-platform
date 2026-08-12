import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyToken,
  registerUser,
  loginUser,
  getUserById,
  getUserByEmail,
  updateUserProfile,
  deleteUser,
} from '@/lib/auth';
import { resetDatabase } from '@/test-utils/db';

describe('auth', () => {
  beforeEach(() => {
    resetDatabase();
  });

  describe('generateId', () => {
    it('generates unique ids', () => {
      expect(generateId()).not.toBe(generateId());
    });
  });

  describe('password hashing', () => {
    it('hashes and verifies passwords', async () => {
      const hash = await hashPassword('secret');
      expect(hash).not.toBe('secret');
      expect(await verifyPassword('secret', hash)).toBe(true);
      expect(await verifyPassword('wrong', hash)).toBe(false);
    });
  });

  describe('tokens', () => {
    it('generates and verifies tokens', () => {
      const { accessToken, refreshToken } = generateTokens('user-1');
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(verifyToken(accessToken)?.userId).toBe('user-1');
      expect(verifyToken(refreshToken)?.userId).toBe('user-1');
    });
    it('returns null for invalid tokens', () => {
      expect(verifyToken('not-a-token')).toBeNull();
      expect(verifyToken('')).toBeNull();
    });
    it('returns null for tampered tokens', () => {
      const { accessToken } = generateTokens('user-1');
      expect(verifyToken(`${accessToken}x`)).toBeNull();
    });
  });

  describe('registerUser', () => {
    it('creates a user with defaults', async () => {
      const { user, tokens } = await registerUser('a@test.local', 'password123', 'Alice');
      expect(user.id).toBeTruthy();
      expect(user.email).toBe('a@test.local');
      expect(user.displayName).toBe('Alice');
      expect(user.preferences.language).toBe('nl');
      expect(tokens.accessToken).toBeTruthy();
    });
    it('rejects duplicate emails', async () => {
      await registerUser('dup@test.local', 'password123', 'A');
      await expect(registerUser('dup@test.local', 'other', 'B')).rejects.toThrow();
    });
  });

  describe('loginUser', () => {
    it('logs in with correct credentials', async () => {
      await registerUser('login@test.local', 'password123', 'Bob');
      const result = await loginUser('login@test.local', 'password123');
      expect(result).not.toBeNull();
      expect(result!.user.email).toBe('login@test.local');
      expect(result!.tokens.accessToken).toBeTruthy();
    });
    it('returns null for wrong password', async () => {
      await registerUser('bad@test.local', 'password123', 'Bob');
      expect(await loginUser('bad@test.local', 'wrong')).toBeNull();
    });
    it('returns null for unknown email', async () => {
      expect(await loginUser('ghost@test.local', 'password123')).toBeNull();
    });
  });

  describe('user lookup', () => {
    it('gets a user by id and email', async () => {
      const { user } = await registerUser('lookup@test.local', 'password123', 'Carol');
      expect(getUserById(user.id)?.email).toBe('lookup@test.local');
      expect(getUserByEmail('lookup@test.local')?.id).toBe(user.id);
    });
    it('returns null for missing users', () => {
      expect(getUserById('nope')).toBeNull();
      expect(getUserByEmail('nope@test.local')).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('updates fields and preserves others', async () => {
      const { user } = await registerUser('update@test.local', 'password123', 'Dave');
      const updated = updateUserProfile(user.id, {
        displayName: 'David',
        school: 'HS 1',
        grade: '5',
      });
      expect(updated?.displayName).toBe('David');
      expect(updated?.school).toBe('HS 1');
      expect(updated?.grade).toBe('5');
      expect(updated?.email).toBe('update@test.local');
    });
    it('updates preferences', async () => {
      const { user } = await registerUser('pref@test.local', 'password123', 'Eve');
      const updated = updateUserProfile(user.id, {
        preferences: { ...user.preferences, language: 'en' },
      });
      expect(updated?.preferences.language).toBe('en');
    });
    it('returns user unchanged for empty updates', async () => {
      const { user } = await registerUser('none@test.local', 'password123', 'Fay');
      const updated = updateUserProfile(user.id, {});
      expect(updated?.displayName).toBe('Fay');
    });
  });

  describe('deleteUser', () => {
    it('deletes an existing user', async () => {
      const { user } = await registerUser('del@test.local', 'password123', 'Gus');
      expect(deleteUser(user.id)).toBe(true);
      expect(getUserById(user.id)).toBeNull();
    });
    it('returns false for missing user', () => {
      expect(deleteUser('ghost')).toBe(false);
    });
  });
});
