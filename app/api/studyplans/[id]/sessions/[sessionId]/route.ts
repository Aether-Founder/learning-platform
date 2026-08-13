import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndLoad, loadOwnedResource } from '@/lib/api/ownership';
import { badRequest, serverError } from '@/lib/api/responses';
import {
  getStudyPlanById,
  getStudySessionById,
  updateStudySession,
  deleteStudySession,
} from '@/lib/studyplans';

/** Loads a session belonging to a study plan the caller owns. */
async function planSession(
  request: NextRequest,
  { id, sessionId }: { id: string; sessionId: string }
) {
  const planResult = await authenticateAndLoad(request, () => getStudyPlanById(id), {
    notFoundMessage: 'Study plan not found',
    ownerId: (studyPlan) => studyPlan.userId,
  });
  if ('response' in planResult) return planResult;

  const sessionResult = await loadOwnedResource(() => getStudySessionById(sessionId), {
    userId: planResult.user.userId,
    notFoundMessage: 'Study session not found',
  });
  if ('response' in sessionResult) return sessionResult;

  if (sessionResult.resource.studyPlanId !== id) {
    return { response: badRequest('Session does not belong to this study plan') };
  }

  return { session: sessionResult.resource };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  try {
    const result = await planSession(request, params);
    if ('response' in result) return result.response;

    return NextResponse.json({ session: result.session });
  } catch (error) {
    return serverError('Error fetching study session:', error, 'Failed to fetch study session');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  try {
    const result = await planSession(request, params);
    if ('response' in result) return result.response;

    const body = await request.json();
    const { completed, actualDuration } = body;

    const updatedSession = await updateStudySession(params.sessionId, completed, actualDuration);

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    return serverError('Error updating study session:', error, 'Failed to update study session');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  try {
    const result = await planSession(request, params);
    if ('response' in result) return result.response;

    await deleteStudySession(params.sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Error deleting study session:', error, 'Failed to delete study session');
  }
}
