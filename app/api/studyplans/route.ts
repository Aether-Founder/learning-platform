import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getStudyPlansByUser, createStudyPlan } from '@/lib/studyplans';

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
    const testWeekId = searchParams.get('testWeekId');

    let studyPlans;
    if (testWeekId) {
      studyPlans = await getStudyPlansByUser(payload.userId).then((sp) =>
        sp.filter((sp) => sp.testWeekId === testWeekId)
      );
    } else {
      studyPlans = await getStudyPlansByUser(payload.userId);
    }

    return NextResponse.json({ studyPlans });
  } catch (error) {
    console.error('Error fetching study plans:', error);
    return NextResponse.json({ error: 'Failed to fetch study plans' }, { status: 500 });
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
    const { testWeekId, name, startDate, endDate } = body;

    if (!testWeekId || !name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Test week ID, name, start date, and end date are required' },
        { status: 400 }
      );
    }

    const newStudyPlan = await createStudyPlan(
      payload.userId,
      testWeekId,
      name,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({ studyPlan: newStudyPlan }, { status: 201 });
  } catch (error) {
    console.error('Error creating study plan:', error);
    return NextResponse.json({ error: 'Failed to create study plan' }, { status: 500 });
  }
}
