import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getStudySetById, addStudyCard, getStudyCardsByStudySetId } from '@/lib/studysets';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const studySet = getStudySetById(params.id);

    if (!studySet) {
      return NextResponse.json({ error: 'Study set not found' }, { status: 404 });
    }

    // If not public, check authorization
    if (!studySet.isPublic) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (!decoded) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      if (studySet.userId !== decoded.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const cards = getStudyCardsByStudySetId(params.id);
    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Get cards error:', error);
    return NextResponse.json({ error: 'Failed to get cards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const studySet = getStudySetById(params.id);

    if (!studySet) {
      return NextResponse.json({ error: 'Study set not found' }, { status: 404 });
    }

    if (studySet.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { term, definition, imageUrl } = body;

    if (!term || !definition) {
      return NextResponse.json({ error: 'Term and definition are required' }, { status: 400 });
    }

    const card = addStudyCard(params.id, term, definition, imageUrl);

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Add card error:', error);
    return NextResponse.json({ error: 'Failed to add card' }, { status: 500 });
  }
}
