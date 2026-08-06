import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getTestWeekById, addSubjectToTestWeek, removeSubjectFromTestWeek } from '@/lib/testweeks';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const testWeek = getTestWeekById(params.id);

    if (!testWeek) {
      return NextResponse.json(
        { error: 'Test week not found' },
        { status: 404 }
      );
    }

    if (testWeek.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subjectId, subjectName } = body;

    if (!subjectId || !subjectName) {
      return NextResponse.json(
        { error: 'Subject ID and name are required' },
        { status: 400 }
      );
    }

    const subject = addSubjectToTestWeek(params.id, subjectId, subjectName);

    return NextResponse.json({ subject });
  } catch (error) {
    console.error('Add subject error:', error);
    return NextResponse.json(
      { error: 'Failed to add subject' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const testWeek = getTestWeekById(params.id);

    if (!testWeek) {
      return NextResponse.json(
        { error: 'Test week not found' },
        { status: 404 }
      );
    }

    if (testWeek.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subjectId } = body;

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    removeSubjectFromTestWeek(subjectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove subject error:', error);
    return NextResponse.json(
      { error: 'Failed to remove subject' },
      { status: 500 }
    );
  }
}
