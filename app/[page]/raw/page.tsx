import { promises as fs } from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export async function generateMetadata({ params }: { params: { page: string } }) {
  return {
    title: `Raw Content - ${params.page}`,
  };
}

export default async function RawContentPage({ params }: { params: { page: string } }) {
  const { page } = params;
  
  // Construct the file path
  const filePath = path.join(CONTENT_DIR, `${page}.json`);
  
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Content Not Found</h1>
          <p className="text-muted-foreground">The content file "{page}.json" does not exist.</p>
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Raw Content: {page}</h1>
          <p className="text-muted-foreground">
            This page provides the raw JSON content for AI tools like ChatGPT.
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-foreground whitespace-pre-wrap break-words">
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </div>
        
        <div className="mt-4 flex gap-4">
          <a
            href={`/api/content/page/${page}/raw`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Open as API Endpoint
          </a>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${page}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Download JSON
          </button>
        </div>
      </div>
    </div>
  );
}
