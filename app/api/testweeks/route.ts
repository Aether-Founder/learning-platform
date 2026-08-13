import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { badRequest, serverError } from '@/lib/api/responses';
import {
  createTestWeek,
  getTestWeeksByUserId,
  getActiveTestWeek,
  setActiveTestWeek,
} from '@/lib/testweeks';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, { missingTokenMessage: 'No authorization header' });
    if (isAuthFailure(auth)) return auth.response;

    const testWeeks = getTestWeeksByUserId(auth.user.userId);
    const activeTestWeek = getActiveTestWeek(auth.user.userId);

    return NextResponse.json({
      testWeeks,
      activeTestWeek,
    });
  } catch (error) {
    return serverError('Get test weeks error:', error, 'Failed to get test weeks');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, { missingTokenMessage: 'No authorization header' });
    if (isAuthFailure(auth)) return auth.response;

    const { name, startDate, endDate } = await request.json();

    if (!name || !startDate || !endDate) {
      return badRequest('Name, start date, and end date are required');
    }

    const testWeek = createTestWeek(auth.user.userId, name, startDate, endDate);

    // Set as active if it's the first test week
    const existingTestWeeks = getTestWeeksByUserId(auth.user.userId);
    if (existingTestWeeks.length === 1) {
      setActiveTestWeek(auth.user.userId, testWeek.id);
    }

    return NextResponse.json({ testWeek });
  } catch (error) {
    return serverError('Create test week error:', error, 'Failed to create test week');
  }
}
