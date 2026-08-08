import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getTestWeekById, updateTestWeek, deleteTestWeek } from '@/lib/testweeks';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const testWeek = getTestWeekById(params.id);

    if (!testWeek) {
      return NextResponse.json({ error: 'Test week not found' }, { status: 404 });
    }

    if (testWeek.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ testWeek });
  } catch (error) {
    console.error('Get test week error:', error);
    return NextResponse.json({ error: 'Failed to get test week' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const testWeek = getTestWeekById(params.id);

    if (!testWeek) {
      return NextResponse.json({ error: 'Test week not found' }, { status: 404 });
    }

    if (testWeek.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const updatedTestWeek = updateTestWeek(params.id, body);

    return NextResponse.json({ testWeek: updatedTestWeek });
  } catch (error) {
    console.error('Update test week error:', error);
    return NextResponse.json({ error: 'Failed to update test week' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const testWeek = getTestWeekById(params.id);

    if (!testWeek) {
      return NextResponse.json({ error: 'Test week not found' }, { status: 404 });
    }

    if (testWeek.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    deleteTestWeek(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete test week error:', error);
    return NextResponse.json({ error: 'Failed to delete test week' }, { status: 500 });
  }
}
