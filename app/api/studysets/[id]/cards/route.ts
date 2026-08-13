import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { authenticateAndLoad } from '@/lib/api/ownership';
import { badRequest, forbidden, notFound, serverError } from '@/lib/api/responses';
import { getStudySetById, addStudyCard, getStudyCardsByStudySetId } from '@/lib/studysets';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const studySet = getStudySetById(params.id);

    if (!studySet) {
      return notFound('Study set not found');
    }

    if (!studySet.isPublic) {
      const auth = authenticateRequest(request, {
        missingTokenMessage: 'No authorization header',
      });
      if (isAuthFailure(auth)) return auth.response;

      if (studySet.userId !== auth.user.userId) {
        return forbidden('Unauthorized');
      }
    }

    const cards = getStudyCardsByStudySetId(params.id);
    return NextResponse.json({ cards });
  } catch (error) {
    return serverError('Get cards error:', error, 'Failed to get cards');
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await authenticateAndLoad(request, () => getStudySetById(params.id), {
      missingTokenMessage: 'No authorization header',
      notFoundMessage: 'Study set not found',
      ownerId: (studySet) => studySet.userId,
      forbiddenMessage: 'Unauthorized',
    });
    if ('response' in result) return result.response;

    const { term, definition, imageUrl } = await request.json();

    if (!term || !definition) {
      return badRequest('Term and definition are required');
    }

    const card = addStudyCard(params.id, term, definition, imageUrl);

    return NextResponse.json({ card });
  } catch (error) {
    return serverError('Add card error:', error, 'Failed to add card');
  }
}
