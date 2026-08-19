import { NextResponse } from 'next/server';
import { loadSubject, loadChapters } from '@/lib/content-loader';

export async function GET(request: Request, { params }: { params: { subjectId: string } }) {
  try {
    const subjectId = params.subjectId;

    // Load subject from JSON
    const subject = await loadSubject(subjectId);

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Load chapters
    const chapters = await loadChapters(subjectId);

    // Calculate total content counts
    let totalLearningSets = 0;
    let totalQuizzes = 0;
    let totalSummaries = 0;
    let totalPracticeTests = 0;

    for (const chapter of chapters) {
      totalLearningSets += chapter.content.learningSets.length;
      totalQuizzes += chapter.content.quizzes.length;
      totalSummaries += chapter.content.summaries.length;
      totalPracticeTests += chapter.content.practiceTests.length;
    }

    return NextResponse.json({
      subject,
      chapters,
      stats: {
        learningSets: totalLearningSets,
        quizzes: totalQuizzes,
        summaries: totalSummaries,
        practiceTests: totalPracticeTests,
        totalChapters: chapters.length,
      },
    });
  } catch (error) {
    console.error('Error loading subject content:', error);
    return NextResponse.json({ error: 'Failed to load subject' }, { status: 500 });
  }
}
