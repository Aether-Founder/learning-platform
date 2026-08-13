import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { badRequest, serverError } from '@/lib/api/responses';
import { getHomeworkByUserId, createHomework } from '@/lib/homework';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const subject = searchParams.get('subject');

    let homework = await getHomeworkByUserId(auth.user.userId);
    if (status === 'pending') {
      homework = homework.filter((h) => h.status !== 'completed');
    } else if (subject) {
      homework = homework.filter((h) => h.subject === subject);
    }

    return NextResponse.json({ homework });
  } catch (error) {
    return serverError('Error fetching homework:', error, 'Failed to fetch homework');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const {
      title,
      description,
      subject,
      dueDate,
      priority,
      estimatedTime,
      testWeekId,
      relatedStudySetId,
    } = await request.json();

    if (!title || !subject || !dueDate) {
      return badRequest('Title, subject, and due date are required');
    }

    const newHomework = await createHomework(
      auth.user.userId,
      title,
      description,
      subject,
      new Date(dueDate),
      priority || 'medium',
      estimatedTime,
      testWeekId,
      relatedStudySetId
    );

    return NextResponse.json({ homework: newHomework }, { status: 201 });
  } catch (error) {
    return serverError('Error creating homework:', error, 'Failed to create homework');
  }
}
