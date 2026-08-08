import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getStudySessionAnalytics } from '@/lib/analytics-aggregation';

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
    const limit = parseInt(searchParams.get('limit') || '10');

    const sessions = await getStudySessionAnalytics(payload.userId, limit);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching session analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch session analytics' }, { status: 500 });
  }
}
