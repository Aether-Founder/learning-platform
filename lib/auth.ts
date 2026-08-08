import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  createdAt: string;
  lastActiveAt: string;
  preferences: UserPreferences;
  subscription: 'free' | 'premium';
  school?: string;
  grade?: string;
}

export interface UserPreferences {
  language: 'nl' | 'en';
  theme: 'light' | 'dark' | 'system';
  defaultViewMode: 'book' | 'study' | 'simple' | 'advanced';
  studyReminderTime?: string;
  studyReminderDays: number[];
  timezone: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT tokens
export function generateTokens(userId: string): AuthTokens {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });

  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

// Register a new user
export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: User; tokens: AuthTokens }> {
  const userId = generateId();
  const passwordHash = await hashPassword(password);

  const defaultPreferences: UserPreferences = {
    language: 'nl',
    theme: 'system',
    defaultViewMode: 'book',
    studyReminderDays: [1, 2, 3, 4, 5],
    timezone: 'Europe/Amsterdam',
  };

  const stmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, preferences)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(userId, email, passwordHash, displayName, JSON.stringify(defaultPreferences));

  const user = getUserById(userId);
  if (!user) {
    throw new Error('Failed to create user');
  }

  const tokens = generateTokens(userId);
  return { user, tokens };
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User; tokens: AuthTokens } | null> {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const userRow = stmt.get(email) as any;

  if (!userRow) {
    return null;
  }

  const isValid = await verifyPassword(password, userRow.password_hash);
  if (!isValid) {
    return null;
  }

  // Update last active timestamp
  const updateStmt = db.prepare('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?');
  updateStmt.run(userRow.id);

  const user = getUserById(userRow.id);
  if (!user) {
    return null;
  }

  const tokens = generateTokens(userRow.id);
  return { user, tokens };
}

// Get user by ID
export function getUserById(userId: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const userRow = stmt.get(userId) as any;

  if (!userRow) {
    return null;
  }

  return {
    id: userRow.id,
    email: userRow.email,
    displayName: userRow.display_name,
    avatar: userRow.avatar_url,
    createdAt: userRow.created_at,
    lastActiveAt: userRow.last_active_at,
    preferences: JSON.parse(userRow.preferences || '{}'),
    subscription: userRow.subscription,
    school: userRow.school,
    grade: userRow.grade,
  };
}

// Get user by email
export function getUserByEmail(email: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const userRow = stmt.get(email) as any;

  if (!userRow) {
    return null;
  }

  return {
    id: userRow.id,
    email: userRow.email,
    displayName: userRow.display_name,
    avatar: userRow.avatar_url,
    createdAt: userRow.created_at,
    lastActiveAt: userRow.last_active_at,
    preferences: JSON.parse(userRow.preferences || '{}'),
    subscription: userRow.subscription,
    school: userRow.school,
    grade: userRow.grade,
  };
}

// Update user profile
export function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'displayName' | 'avatar' | 'school' | 'grade' | 'preferences'>>
): User | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.displayName !== undefined) {
    fields.push('display_name = ?');
    values.push(updates.displayName);
  }
  if (updates.avatar !== undefined) {
    fields.push('avatar_url = ?');
    values.push(updates.avatar);
  }
  if (updates.school !== undefined) {
    fields.push('school = ?');
    values.push(updates.school);
  }
  if (updates.grade !== undefined) {
    fields.push('grade = ?');
    values.push(updates.grade);
  }
  if (updates.preferences !== undefined) {
    fields.push('preferences = ?');
    values.push(JSON.stringify(updates.preferences));
  }

  if (fields.length === 0) {
    return getUserById(userId);
  }

  values.push(userId);
  const stmt = db.prepare(`
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
  return getUserById(userId);
}

// Delete user
export function deleteUser(userId: string): boolean {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(userId);
  return result.changes > 0;
}
