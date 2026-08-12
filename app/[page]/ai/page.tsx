import { promises as fs } from 'fs';
import path from 'path';
import { getServerT } from '@/lib/i18n-server';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export async function generateMetadata({ params }: { params: { page: string } }) {
  const t = await getServerT();
  return {
    title: t('ai_title', `AI Content - ${params.page}`, { page: params.page }),
    robots: {
      index: true,
      follow: true,
    },
  };
}

function jsonToHtml(data: any, indent = 0): string {
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
    return data.map((item) => jsonToHtml(item, indent)).join('\n');
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) return '{}';
    return entries
      .map(([key, value]) => {
        const valueStr = jsonToHtml(value, indent + 1);
        if (typeof value === 'object' && value !== null) {
          return `${'  '.repeat(indent)}${key}:\n${valueStr}`;
        }
        return `${'  '.repeat(indent)}${key}: ${valueStr}`;
      })
      .join('\n');
  }
  return String(data);
}

export default async function AIContentPage({ params }: { params: { page: string } }) {
  const { page } = params;
  const t = await getServerT();

  // Construct the file path
  const filePath = path.join(CONTENT_DIR, `${page}.json`);

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    return (
      <div>
        <h1>{t('content_not_found', 'Content Not Found')}</h1>
        <p>{t('content_file_missing', 'The content file "{page}.json" does not exist.', { page })}</p>
      </div>
    );
  }

  // Read the JSON file
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const jsonData = JSON.parse(fileContent);

  // Return the raw-ish HTML for AI tools
  return (
    <div>
      <h1>{t('ai_title', 'AI Content')}</h1>
      <p>{t('ai_ingested', 'The content file "{page}.json" is ingested into the text below.', { page })}</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{jsonToHtml(jsonData)}</pre>
    </div>
  );
}
