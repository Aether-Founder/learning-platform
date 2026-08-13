import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { serverError } from '@/lib/api/responses';
import { getStudySessionAnalytics } from '@/lib/analytics-aggregation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    const sessions = await getStudySessionAnalytics(auth.user.userId, limit);

    return NextResponse.json({ sessions });
  } catch (error) {
    return serverError(
      'Error fetching session analytics:',
      error,
      'Failed to fetch session analytics'
    );
  }
}
