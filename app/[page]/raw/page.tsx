import { promises as fs } from 'fs';
import path from 'path';
import { getServerT } from '@/lib/i18n-server';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export async function generateMetadata({ params }: { params: { page: string } }) {
  const t = await getServerT();
  return {
    title: t('raw_title', `Raw Content - ${params.page}`, { page: params.page }),
  };
}

export default async function RawContentPage({ params }: { params: { page: string } }) {
  const { page } = params;
  const t = await getServerT();

  // Construct the file path
  const filePath = path.join(CONTENT_DIR, `${page}.json`);

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('content_not_found', 'Content Not Found')}</h1>
          <p className="text-muted-foreground">{t('content_file_missing', 'The content file "{page}.json" does not exist.', { page })}</p>
        </div>
      </div>
    );
  }

  // Read the JSON file
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const jsonData = JSON.parse(fileContent);

  // Return the raw JSON as a downloadable/accessible format
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('raw_title', 'Raw Content: {page}', { page })}</h1>
          <p className="text-muted-foreground">
            {t('raw_description', 'This page provides the raw JSON content for AI tools like ChatGPT.')}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-foreground whitespace-pre-wrap break-words">
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
