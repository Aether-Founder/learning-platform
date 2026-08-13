import { promises as fs } from 'fs';
import path from 'path';

export const CONTENT_DIR = path.join(process.cwd(), 'content');

/** CORS headers used by the publicly readable content endpoints. */
export const CONTENT_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** Strips anything that could escape the content directory. */
export function sanitizePageName(page: string): string {
  return page.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function contentFilePath(pageName: string): string {
  return path.join(CONTENT_DIR, `${pageName}.json`);
}

/** Parsed content page, or null when the file does not exist. */
export async function readContentPage(pageName: string): Promise<unknown | null> {
  const filePath = contentFilePath(pageName);

  try {
    await fs.access(filePath);
  } catch {
    return null;
  }

  return JSON.parse(await fs.readFile(filePath, 'utf-8'));
}

/** Renders parsed JSON as indented plain text for AI/LLM consumers. */
export function jsonToPlainText(data: unknown, indent = 0): string {
  if (typeof data === 'string') return data;
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);
  if (data === null) return 'null';

  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    return data.map((item) => jsonToPlainText(item, indent)).join('\n');
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries
      .map(([key, value]) => {
        const valueStr = jsonToPlainText(value, indent + 1);
        if (typeof value === 'object' && value !== null) {
          return `${'  '.repeat(indent)}${key}:\n${valueStr}`;
        }
        return `${'  '.repeat(indent)}${key}: ${valueStr}`;
      })
      .join('\n');
  }

  return String(data);
}
