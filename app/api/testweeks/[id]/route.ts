import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndLoad } from '@/lib/api/ownership';
import { serverError } from '@/lib/api/responses';
import { getTestWeekById, updateTestWeek, deleteTestWeek } from '@/lib/testweeks';

const ownedTestWeek = (request: NextRequest, id: string) =>
  authenticateAndLoad(request, () => getTestWeekById(id), {
    missingTokenMessage: 'No authorization header',
    notFoundMessage: 'Test week not found',
    ownerId: (testWeek) => testWeek.userId,
    forbiddenMessage: 'Unauthorized',
  });

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedTestWeek(request, params.id);
    if ('response' in result) return result.response;

    return NextResponse.json({ testWeek: result.resource });
  } catch (error) {
    return serverError('Get test week error:', error, 'Failed to get test week');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedTestWeek(request, params.id);
    if ('response' in result) return result.response;

    const updatedTestWeek = updateTestWeek(params.id, await request.json());

    return NextResponse.json({ testWeek: updatedTestWeek });
  } catch (error) {
    return serverError('Update test week error:', error, 'Failed to update test week');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedTestWeek(request, params.id);
    if ('response' in result) return result.response;

    deleteTestWeek(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Delete test week error:', error, 'Failed to delete test week');
  }
}
