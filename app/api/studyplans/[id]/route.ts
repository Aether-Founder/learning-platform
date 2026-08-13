import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndLoad } from '@/lib/api/ownership';
import { serverError } from '@/lib/api/responses';
import {
  getStudyPlanById,
  updateStudyPlan,
  deleteStudyPlan,
  getStudySessionsByPlan,
} from '@/lib/studyplans';

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

    return NextResponse.json({ studyPlan: result.resource, sessions });
  } catch (error) {
    return serverError('Error fetching study plan:', error, 'Failed to fetch study plan');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedStudyPlan(request, params.id);
    if ('response' in result) return result.response;

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
    return serverError('Error updating study plan:', error, 'Failed to update study plan');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedStudyPlan(request, params.id);
    if ('response' in result) return result.response;

    await deleteStudyPlan(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Error deleting study plan:', error, 'Failed to delete study plan');
  }
}
