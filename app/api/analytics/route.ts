import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserAnalytics, getAggregatedAnalytics } from '@/lib/analytics-aggregation';

export const dynamic = 'force-dynamic';

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
    const type = searchParams.get('type') || 'user';
    const timeRange =
      (searchParams.get('timeRange') as 'day' | 'week' | 'month' | 'year') || 'week';

    if (type === 'aggregated') {
      const analytics = await getAggregatedAnalytics(timeRange);
      return NextResponse.json({ analytics });
    } else {
      const analytics = await getUserAnalytics(payload.userId);
      return NextResponse.json({ analytics });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
