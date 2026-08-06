import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getStudySetsByUserId, createStudySet, searchStudySets, getPublicStudySets, addStudyCard } from '@/lib/studysets';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const publicOnly = searchParams.get('public') === 'true';

    logger.info('Handling GET /api/studysets', { route: '/api/studysets', query, publicOnly });

    if (publicOnly) {
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');
      const studySets = getPublicStudySets(limit, offset);
      logger.info('Fetched public study sets', { count: studySets.length, limit, offset });
      return NextResponse.json({ studySets });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Unauthorized GET /api/studysets attempt - missing auth header');
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      logger.warn('Unauthorized GET /api/studysets attempt - invalid token');
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    let studySets;
    if (query) {
      studySets = searchStudySets(query, decoded.userId);
      logger.info('Searched study sets', { userId: decoded.userId, query, count: studySets.length });
    } else {
      studySets = getStudySetsByUserId(decoded.userId);
      logger.info('Fetched user study sets', { userId: decoded.userId, count: studySets.length });
    }

    return NextResponse.json({ studySets });
  } catch (error) {
    logger.error('Get study sets error', error, { route: '/api/studysets' });
    return NextResponse.json(
      { error: 'Failed to get study sets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Unauthorized POST /api/studysets attempt - missing auth header');
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      logger.warn('Unauthorized POST /api/studysets attempt - invalid token');
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, folderId, isPublic, cards = [] } = body;

    logger.info('Creating study set', { userId: decoded.userId, title, cardCount: cards.length, isPublic });

    if (!title) {
      logger.warn('Failed to create study set - title missing', { userId: decoded.userId });
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    let studySet = createStudySet(decoded.userId, title, description, folderId, isPublic);
    if (Array.isArray(cards)) {
      cards
        .filter((card: any) => (card.term || card.front) && (card.definition || card.back))
        .forEach((card: any) => {
          addStudyCard(
            studySet.id,
            card.term || card.front,
            card.definition || card.back,
            card.imageUrl || card.image,
            {
              front: card.front,
              back: card.back,
              cardType: card.cardType || card.type,
              audioUrl: card.audioUrl || card.audio,
              tags: card.tags || [],
              clozeText: card.clozeText,
              occlusions: card.occlusions || [],
            }
          );
        });
      studySet = getStudySetsByUserId(decoded.userId).find((set) => set.id === studySet.id) || studySet;
    }

    logger.info('Study set created successfully', { studySetId: studySet.id, userId: decoded.userId });
    return NextResponse.json({ studySet });
  } catch (error) {
    logger.error('Create study set error', error, { route: '/api/studysets' });
    return NextResponse.json(
      { error: 'Failed to create study set' },
      { status: 500 }
    );
  }
}
