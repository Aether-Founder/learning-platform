import { promises as fs } from 'fs';
import path from 'path';

export const ANALYTICS_DATA_DIR = path.join(process.cwd(), 'data', 'analytics');

export type AnalyticsFile = 'users.json' | 'sessions.json' | 'events.json';

export async function ensureAnalyticsDir() {
  try {
    await fs.access(ANALYTICS_DATA_DIR);
  } catch {
    await fs.mkdir(ANALYTICS_DATA_DIR, { recursive: true });
  }
}

/** Reads an analytics file, falling back to an empty collection when absent. */
export async function readAnalyticsFile(filename: AnalyticsFile) {
  const filePath = path.join(ANALYTICS_DATA_DIR, filename);
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8'));
  } catch {
    return filename === 'events.json' ? [] : {};
  }
}

export async function writeAnalyticsFile(filename: AnalyticsFile, data: unknown) {
  const filePath = path.join(ANALYTICS_DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
