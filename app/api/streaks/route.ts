import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { serverError } from '@/lib/api/responses';
import { getStreakData, updateStreak, checkStreakStatus } from '@/lib/streaks';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const streakData = await getStreakData(auth.user.userId);
    const status = await checkStreakStatus(auth.user.userId);

    return NextResponse.json({ streakData, status });
  } catch (error) {
    return serverError('Error fetching streak data:', error, 'Failed to fetch streak data');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const { studyDate } = await request.json();

    const updatedStreak = await updateStreak(
      auth.user.userId,
      studyDate ? new Date(studyDate) : new Date()
    );

    return NextResponse.json({ streakData: updatedStreak });
  } catch (error) {
    return serverError('Error updating streak:', error, 'Failed to update streak');
  }
}
