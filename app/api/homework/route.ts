import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getHomeworkByUserId, createHomework } from '@/lib/homework';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const subject = searchParams.get('subject');

    let homework;
    if (status === 'pending') {
      homework = await getHomeworkByUserId(payload.userId).then((hw) =>
        hw.filter((h) => h.status !== 'completed')
      );
    } else if (subject) {
      homework = await getHomeworkByUserId(payload.userId).then((hw) =>
        hw.filter((h) => h.subject === subject)
      );
    } else {
      homework = await getHomeworkByUserId(payload.userId);
    }

    return NextResponse.json({ homework });
  } catch (error) {
    console.error('Error fetching homework:', error);
    return NextResponse.json({ error: 'Failed to fetch homework' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      subject,
      dueDate,
      priority,
      estimatedTime,
      testWeekId,
      relatedStudySetId,
    } = body;

    if (!title || !subject || !dueDate) {
      return NextResponse.json(
        { error: 'Title, subject, and due date are required' },
        { status: 400 }
      );
    }

    const newHomework = await createHomework(
      payload.userId,
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
    console.error('Error creating homework:', error);
    return NextResponse.json({ error: 'Failed to create homework' }, { status: 500 });
  }
}
