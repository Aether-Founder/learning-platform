import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndLoad } from '@/lib/api/ownership';
import { badRequest, serverError } from '@/lib/api/responses';
import { getStudyPlanById, createStudySession, getStudySessionsByPlan } from '@/lib/studyplans';

const ownedStudyPlan = (request: NextRequest, id: string) =>
  authenticateAndLoad(request, () => getStudyPlanById(id), {
    notFoundMessage: 'Study plan not found',
    ownerId: (studyPlan) => studyPlan.userId,
  });

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedStudyPlan(request, params.id);
    if ('response' in result) return result.response;

    const sessions = await getStudySessionsByPlan(params.id);

    return NextResponse.json({ sessions });
  } catch (error) {
    return serverError('Error fetching study sessions:', error, 'Failed to fetch study sessions');
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedStudyPlan(request, params.id);
    if ('response' in result) return result.response;

    const body = await request.json();
    const { subjectId, scheduledDate, duration, topics } = body;

    if (!subjectId || !scheduledDate || !duration) {
      return badRequest('Subject ID, scheduled date, and duration are required');
    }

    const session = await createStudySession(
      params.id,
      subjectId,
      new Date(scheduledDate),
      duration,
      topics
    );

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return serverError('Error creating study session:', error, 'Failed to create study session');
  }
}
