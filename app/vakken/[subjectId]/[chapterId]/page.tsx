import {
  loadSubject,
  loadChapters,
  loadLearningSet,
  loadQuiz,
  loadSummary,
  loadPracticeTest,
  type Chapter,
} from '@/lib/content-loader';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Folder, FileText, Brain } from 'lucide-react';
import Link from 'next/link';

export default async function ChapterDetailPage({
  params,
}: {
  params: { subjectId: string; chapterId: string };
}) {
  const { subjectId, chapterId } = params;

  // Load subject and chapters from JSON
  const subject = await loadSubject(subjectId);
  const chapters = await loadChapters(subjectId);
  const chapter = chapters.find((c) => c.id === chapterId);

  if (!subject || !chapter) {
    return (
      <AppShell fullWidth>
        <div className="text-center py-20">
          <p>Hoofdstuk niet gevonden</p>
          <Link
            href={`/vakken/${subjectId}`}
            className="mt-4 inline-block text-primary hover:underline"
          >
            Terug naar vak
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell fullWidth>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Link href={`/vakken/${subjectId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{chapter.title}</h1>
            <p className="text-sm text-muted-foreground">
              {subject.name} • {chapter.description}
            </p>
          </div>
        </div>

        {/* Filesystem-like Content Structure */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">
              {chapter.content.learningSets.length +
                chapter.content.quizzes.length +
                chapter.content.summaries.length +
                chapter.content.practiceTests.length}{' '}
              items
            </span>
          </div>

          <div className="divide-y divide-border">
            {/* Learning Sets */}
            {chapter.content.learningSets.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/30 font-medium text-sm">Leersets</div>
                {chapter.content.learningSets.map((lsId) => (
                  <Link
                    key={lsId}
                    href={`/vakken/${subjectId}/${chapterId}/learning-set/${lsId}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors pl-8"
                  >
                    <Brain className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {lsId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-muted-foreground">Flashcards</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Quizzes */}
            {chapter.content.quizzes.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/30 font-medium text-sm">Quizzes</div>
                {chapter.content.quizzes.map((quizId) => (
                  <Link
                    key={quizId}
                    href={`/vakken/${subjectId}/${chapterId}/quiz/${quizId}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors pl-8"
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {quizId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-muted-foreground">Quiz</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Summaries */}
            {chapter.content.summaries.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/30 font-medium text-sm">Samenvattingen</div>
                {chapter.content.summaries.map((summaryId) => (
                  <Link
                    key={summaryId}
                    href={`/vakken/${subjectId}/${chapterId}/summary/${summaryId}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors pl-8"
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {summaryId
                          .replace(/-/g, ' ')
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-muted-foreground">Samenvatting</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Practice Tests */}
            {chapter.content.practiceTests.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/30 font-medium text-sm">Oefentoetsen</div>
                {chapter.content.practiceTests.map((testId) => (
                  <Link
                    key={testId}
                    href={`/vakken/${subjectId}/${chapterId}/practice-test/${testId}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors pl-8"
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {testId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-muted-foreground">Oefentoets</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty state */}
            {chapter.content.learningSets.length === 0 &&
              chapter.content.quizzes.length === 0 &&
              chapter.content.summaries.length === 0 &&
              chapter.content.practiceTests.length === 0 && (
                <div className="text-center py-12">
                  <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Nog geen inhoud</p>
                  <p className="text-sm text-muted-foreground">
                    Voeg leersets, quizzes, samenvattingen of oefentoetsen toe aan dit hoofdstuk.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
