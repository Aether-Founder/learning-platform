import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { serverError } from '@/lib/api/responses';
import { getUserAnalytics, getAggregatedAnalytics } from '@/lib/analytics-aggregation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'user';
    const timeRange =
      (searchParams.get('timeRange') as 'day' | 'week' | 'month' | 'year') || 'week';

    const analytics =
      type === 'aggregated'
        ? await getAggregatedAnalytics(timeRange)
        : await getUserAnalytics(auth.user.userId);

    return NextResponse.json({ analytics });
  } catch (error) {
    return serverError('Error fetching analytics:', error, 'Failed to fetch analytics');
  }
}
