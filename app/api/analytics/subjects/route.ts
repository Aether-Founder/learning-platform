import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { serverError } from '@/lib/api/responses';
import { getSubjectAnalytics } from '@/lib/analytics-aggregation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const analytics = await getSubjectAnalytics(auth.user.userId);

    return NextResponse.json({ analytics });
  } catch (error) {
    return serverError(
      'Error fetching subject analytics:',
      error,
      'Failed to fetch subject analytics'
    );
  }
}
