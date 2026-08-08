import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  getUserAchievements,
  getAchievementDefinitions,
  checkAndUnlockAchievements,
} from '@/lib/achievements';

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
    const unlocked = searchParams.get('unlocked');

    let achievements;
    if (unlocked === 'true') {
      achievements = (await getUserAchievements(payload.userId)).filter(
        (a) => a.unlockedAt !== null
      );
    } else if (unlocked === 'false') {
      achievements = (await getUserAchievements(payload.userId)).filter(
        (a) => a.unlockedAt === null
      );
    } else {
      achievements = await getUserAchievements(payload.userId);
    }

    const definitions = await getAchievementDefinitions();

    return NextResponse.json({ achievements, definitions });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
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
    const { eventType, data } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 });
    }

    const newlyUnlocked = await checkAndUnlockAchievements(payload.userId, eventType, data);

    return NextResponse.json({ newlyUnlocked });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json({ error: 'Failed to check achievements' }, { status: 500 });
  }
}
