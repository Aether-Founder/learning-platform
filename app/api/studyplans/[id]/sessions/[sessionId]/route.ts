import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  getStudyPlanById,
  getStudySessionById,
  updateStudySession,
  deleteStudySession,
} from '@/lib/studyplans';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const studyPlan = await getStudyPlanById(params.id);
    if (!studyPlan) {
      return NextResponse.json({ error: 'Study plan not found' }, { status: 404 });
    }

    if (studyPlan.userId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const session = await getStudySessionById(params.sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 });
    }

    if (session.studyPlanId !== params.id) {
      return NextResponse.json(
        { error: 'Session does not belong to this study plan' },
        { status: 400 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching study session:', error);
    return NextResponse.json({ error: 'Failed to fetch study session' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const studyPlan = await getStudyPlanById(params.id);
    if (!studyPlan) {
      return NextResponse.json({ error: 'Study plan not found' }, { status: 404 });
    }

    if (studyPlan.userId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const session = await getStudySessionById(params.sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 });
    }

    if (session.studyPlanId !== params.id) {
      return NextResponse.json(
        { error: 'Session does not belong to this study plan' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { completed, actualDuration } = body;

    const updatedSession = await updateStudySession(params.sessionId, completed, actualDuration);

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Error updating study session:', error);
    return NextResponse.json({ error: 'Failed to update study session' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const studyPlan = await getStudyPlanById(params.id);
    if (!studyPlan) {
      return NextResponse.json({ error: 'Study plan not found' }, { status: 404 });
    }

    if (studyPlan.userId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const session = await getStudySessionById(params.sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 });
    }

    if (session.studyPlanId !== params.id) {
      return NextResponse.json(
        { error: 'Session does not belong to this study plan' },
        { status: 400 }
      );
    }

    await deleteStudySession(params.sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting study session:', error);
    return NextResponse.json({ error: 'Failed to delete study session' }, { status: 500 });
  }
}
