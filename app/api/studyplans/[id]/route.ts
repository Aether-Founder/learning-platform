import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  getStudyPlanById,
  updateStudyPlan,
  deleteStudyPlan,
  getStudySessionsByPlan,
} from '@/lib/studyplans';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const sessions = await getStudySessionsByPlan(params.id);

    return NextResponse.json({ studyPlan, sessions });
  } catch (error) {
    console.error('Error fetching study plan:', error);
    return NextResponse.json({ error: 'Failed to fetch study plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json();
    const { name, startDate, endDate } = body;

    const updatedStudyPlan = await updateStudyPlan(
      params.id,
      name,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({ studyPlan: updatedStudyPlan });
  } catch (error) {
    console.error('Error updating study plan:', error);
    return NextResponse.json({ error: 'Failed to update study plan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    await deleteStudyPlan(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting study plan:', error);
    return NextResponse.json({ error: 'Failed to delete study plan' }, { status: 500 });
  }
}
