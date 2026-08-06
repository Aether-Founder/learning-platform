import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createTestWeek, getTestWeeksByUserId, getActiveTestWeek, setActiveTestWeek } from '@/lib/testweeks';

export async function GET(request: NextRequest) {
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

    const testWeeks = getTestWeeksByUserId(decoded.userId);
    const activeTestWeek = getActiveTestWeek(decoded.userId);

    return NextResponse.json({
      testWeeks,
      activeTestWeek,
    });
  } catch (error) {
    console.error('Get test weeks error:', error);
    return NextResponse.json(
      { error: 'Failed to get test weeks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, startDate, endDate } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, start date, and end date are required' },
        { status: 400 }
      );
    }

    const testWeek = createTestWeek(decoded.userId, name, startDate, endDate);

    // Set as active if it's the first test week
    const existingTestWeeks = getTestWeeksByUserId(decoded.userId);
    if (existingTestWeeks.length === 1) {
      setActiveTestWeek(decoded.userId, testWeek.id);
    }

    return NextResponse.json({ testWeek });
  } catch (error) {
    console.error('Create test week error:', error);
    return NextResponse.json(
      { error: 'Failed to create test week' },
      { status: 500 }
    );
  }
}
