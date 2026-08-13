import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { authenticateAndLoad } from '@/lib/api/ownership';
import { forbidden, notFound, serverError } from '@/lib/api/responses';
import { getStudySetById, updateStudySet, deleteStudySet } from '@/lib/studysets';

const ownedStudySet = (request: NextRequest, id: string) =>
  authenticateAndLoad(request, () => getStudySetById(id), {
    missingTokenMessage: 'No authorization header',
    notFoundMessage: 'Study set not found',
    ownerId: (studySet) => studySet.userId,
    forbiddenMessage: 'Unauthorized',
  });

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

    return NextResponse.json({ studySet });
  } catch (error) {
    return serverError('Get study set error:', error, 'Failed to get study set');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedStudySet(request, params.id);
    if ('response' in result) return result.response;

    const updatedStudySet = updateStudySet(params.id, await request.json());

    return NextResponse.json({ studySet: updatedStudySet });
  } catch (error) {
    return serverError('Update study set error:', error, 'Failed to update study set');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedStudySet(request, params.id);
    if ('response' in result) return result.response;

    deleteStudySet(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Delete study set error:', error, 'Failed to delete study set');
  }
}
