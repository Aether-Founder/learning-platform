import { registerUser, generateTokens, type User } from '@/lib/auth';

let counter = 0;

export interface TestUser {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function createTestUser(overrides?: {
  email?: string;
  password?: string;
  displayName?: string;
}): Promise<TestUser> {
  counter += 1;
  const email = overrides?.email ?? `user-${Date.now()}-${counter}@test.local`;
  const password = overrides?.password ?? 'password123';
  const displayName = overrides?.displayName ?? `Test User ${counter}`;
  const { user, tokens } = await registerUser(email, password, displayName);
  return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

export function tokenFor(userId: string): { accessToken: string; refreshToken: string } {
  return generateTokens(userId);
}

export function authHeader(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}
