import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { badRequest, serverError } from '@/lib/api/responses';
import {
  getUserAchievements,
  getAchievementDefinitions,
  checkAndUnlockAchievements,
} from '@/lib/achievements';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const unlocked = request.nextUrl.searchParams.get('unlocked');

    let achievements = await getUserAchievements(auth.user.userId);
    if (unlocked === 'true') {
      achievements = achievements.filter((a) => a.unlockedAt !== null);
    } else if (unlocked === 'false') {
      achievements = achievements.filter((a) => a.unlockedAt === null);
    }

    const definitions = await getAchievementDefinitions();

    return NextResponse.json({ achievements, definitions });
  } catch (error) {
    return serverError('Error fetching achievements:', error, 'Failed to fetch achievements');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const { eventType, data } = await request.json();

    if (!eventType) {
      return badRequest('Event type is required');
    }

    const newlyUnlocked = await checkAndUnlockAchievements(auth.user.userId, eventType, data);

    return NextResponse.json({ newlyUnlocked });
  } catch (error) {
    return serverError('Error checking achievements:', error, 'Failed to check achievements');
  }
}
