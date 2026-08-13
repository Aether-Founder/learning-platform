import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndLoad } from '@/lib/api/ownership';
import { badRequest, serverError } from '@/lib/api/responses';
import { getTestWeekById, addSubjectToTestWeek, removeSubjectFromTestWeek } from '@/lib/testweeks';

const ownedTestWeek = (request: NextRequest, id: string) =>
  authenticateAndLoad(request, () => getTestWeekById(id), {
    missingTokenMessage: 'No authorization header',
    notFoundMessage: 'Test week not found',
    ownerId: (testWeek) => testWeek.userId,
    forbiddenMessage: 'Unauthorized',
  });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedTestWeek(request, params.id);
    if ('response' in result) return result.response;

    const { subjectId, subjectName } = await request.json();

    if (!subjectId || !subjectName) {
      return badRequest('Subject ID and name are required');
    }

    const subject = addSubjectToTestWeek(params.id, subjectId, subjectName);

    return NextResponse.json({ subject });
  } catch (error) {
    return serverError('Add subject error:', error, 'Failed to add subject');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedTestWeek(request, params.id);
    if ('response' in result) return result.response;

    const { subjectId } = await request.json();

    if (!subjectId) {
      return badRequest('Subject ID is required');
    }

    removeSubjectFromTestWeek(subjectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Remove subject error:', error, 'Failed to remove subject');
  }
}
