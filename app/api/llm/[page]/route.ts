import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

function jsonToPlainText(data: any, indent = 0): string {
  if (typeof data === 'string') {
    return data;
  }
  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }
  if (data === null) {
    return 'null';
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    return data.map((item) => jsonToPlainText(item, indent)).join('\n');
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data);
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

export async function GET(_request: NextRequest, { params }: { params: { page: string } }) {
  try {
    // Sanitize: only allow alphanumeric, hyphens, underscores
    const pageName = params.page.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!pageName) {
      return NextResponse.json({ error: 'Invalid page name' }, { status: 400 });
    }

    const filePath = path.join(CONTENT_DIR, `${pageName}.json`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: 'Content file not found' }, { status: 404 });
    }

    // Read the JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    // Convert to structured plain text for AI
    const plainText = jsonToPlainText(jsonData);

    // Return as plain text with proper headers for AI accessibility
    return new NextResponse(plainText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error serving LLM content:', error);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}
