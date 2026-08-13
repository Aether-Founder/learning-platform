import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { badRequest, serverError } from '@/lib/api/responses';
import { getStudyPlansByUser, createStudyPlan } from '@/lib/studyplans';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const testWeekId = request.nextUrl.searchParams.get('testWeekId');
    const allPlans = await getStudyPlansByUser(auth.user.userId);
    const studyPlans = testWeekId
      ? allPlans.filter((plan) => plan.testWeekId === testWeekId)
      : allPlans;

    return NextResponse.json({ studyPlans });
  } catch (error) {
    return serverError('Error fetching study plans:', error, 'Failed to fetch study plans');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const body = await request.json();
    const { testWeekId, name, startDate, endDate } = body;

    if (!testWeekId || !name || !startDate || !endDate) {
      return badRequest('Test week ID, name, start date, and end date are required');
    }

    const newStudyPlan = await createStudyPlan(
      auth.user.userId,
      testWeekId,
      name,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({ studyPlan: newStudyPlan }, { status: 201 });
  } catch (error) {
    return serverError('Error creating study plan:', error, 'Failed to create study plan');
  }
}
