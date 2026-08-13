import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { badRequest, errorResponse } from '@/lib/api/responses';
import {
  getStudySetsByUserId,
  createStudySet,
  searchStudySets,
  getPublicStudySets,
  addStudyCard,
} from '@/lib/studysets';
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

    const auth = authenticateRequest(request, { missingTokenMessage: 'No authorization header' });
    if (isAuthFailure(auth)) {
      logger.warn('Unauthorized GET /api/studysets attempt');
      return auth.response;
    }

    const { userId } = auth.user;

    let studySets;
    if (query) {
      studySets = searchStudySets(query, userId);
      logger.info('Searched study sets', { userId, query, count: studySets.length });
    } else {
      studySets = getStudySetsByUserId(userId);
      logger.info('Fetched user study sets', { userId, count: studySets.length });
    }

    return NextResponse.json({ studySets });
  } catch (error) {
    logger.error('Get study sets error', error, { route: '/api/studysets' });
    return errorResponse('Failed to get study sets', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, { missingTokenMessage: 'No authorization header' });
    if (isAuthFailure(auth)) {
      logger.warn('Unauthorized POST /api/studysets attempt');
      return auth.response;
    }

    const { userId } = auth.user;
    const body = await request.json();
    const { title, description, folderId, isPublic, cards = [] } = body;

    logger.info('Creating study set', {
      userId,
      title,
      cardCount: cards.length,
      isPublic,
    });

    if (!title) {
      logger.warn('Failed to create study set - title missing', { userId });
      return badRequest('Title is required');
    }

    let studySet = createStudySet(userId, title, description, folderId, isPublic);
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
      studySet = getStudySetsByUserId(userId).find((set) => set.id === studySet.id) || studySet;
    }

    logger.info('Study set created successfully', { studySetId: studySet.id, userId });
    return NextResponse.json({ studySet });
  } catch (error) {
    logger.error('Create study set error', error, { route: '/api/studysets' });
    return errorResponse('Failed to create study set', 500);
  }
}
