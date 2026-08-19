import {
  loadSubject,
  loadChapters,
  type Subject as JsonSubject,
  type Chapter,
} from '@/lib/content-loader';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Folder, FileText } from 'lucide-react';
import Link from 'next/link';

type Subject = {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  level: string;
  mastery: number;
  topics: number;
  topics_done: number;
  due_count: number;
};

export default async function SubjectDetailPage({ params }: { params: { subjectId: string } }) {
  const subjectId = params.subjectId;

  // Load subject from JSON
  const subject = await loadSubject(subjectId);

  // Use subject data if available, otherwise use subjectId as fallback
  const subjectName = subject?.name || subjectId.charAt(0).toUpperCase() + subjectId.slice(1);
  const subjectDescription = subject?.description || '';

  // Load chapters from JSON
  const chapters = await loadChapters(subjectId);

  return (
    <AppShell fullWidth>
      <PageHeader title={subjectName} description={subjectDescription} fullWidth />

      <div className="space-y-6">
        {/* Filesystem-like Content Structure */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">{chapters.length} items</span>
          </div>

          <div className="divide-y divide-border">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/vakken/${subjectId}/${chapter.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <Folder className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{chapter.title}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {chapter.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
