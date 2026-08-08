import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getStudySetById, updateStudySet, deleteStudySet } from '@/lib/studysets';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const studySet = getStudySetById(params.id);

    if (!studySet) {
      return NextResponse.json({ error: 'Study set not found' }, { status: 404 });
    }

    // If not public, check authorization
    if (!studySet.isPublic) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (!decoded) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      if (studySet.userId !== decoded.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    return NextResponse.json({ studySet });
  } catch (error) {
    console.error('Get study set error:', error);
    return NextResponse.json({ error: 'Failed to get study set' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const studySet = getStudySetById(params.id);

    if (!studySet) {
      return NextResponse.json({ error: 'Study set not found' }, { status: 404 });
    }

    if (studySet.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const updatedStudySet = updateStudySet(params.id, body);

    return NextResponse.json({ studySet: updatedStudySet });
  } catch (error) {
    console.error('Update study set error:', error);
    return NextResponse.json({ error: 'Failed to update study set' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const studySet = getStudySetById(params.id);

    if (!studySet) {
      return NextResponse.json({ error: 'Study set not found' }, { status: 404 });
    }

    if (studySet.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    deleteStudySet(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete study set error:', error);
    return NextResponse.json({ error: 'Failed to delete study set' }, { status: 500 });
  }
}
