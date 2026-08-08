import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSubjectAnalytics } from '@/lib/analytics-aggregation';

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

    const analytics = await getSubjectAnalytics(payload.userId);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching subject analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch subject analytics' }, { status: 500 });
  }
}
