import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndLoad } from '@/lib/api/ownership';
import { badRequest, serverError } from '@/lib/api/responses';
import { getClassById, addClassMember, getClassMembers, removeClassMember } from '@/lib/classes';

const taughtClass = (request: NextRequest, id: string) =>
  authenticateAndLoad(request, () => getClassById(id), {
    notFoundMessage: 'Class not found',
    ownerId: (classData) => classData.teacherId,
  });

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await taughtClass(request, params.id);
    if ('response' in result) return result.response;

    const members = await getClassMembers(params.id);

    return NextResponse.json({ members });
  } catch (error) {
    return serverError('Error fetching class members:', error, 'Failed to fetch class members');
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await authenticateAndLoad(request, () => getClassById(params.id), {
      notFoundMessage: 'Class not found',
    });
    if ('response' in result) return result.response;

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return badRequest('Class code is required');
    }

    if (result.resource.code !== code) {
      return badRequest('Invalid class code');
    }

    const member = await addClassMember(params.id, result.user.userId, 'student');

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return serverError('Error adding class member:', error, 'Failed to add class member');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await taughtClass(request, params.id);
    if ('response' in result) return result.response;

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return badRequest('User ID is required');
    }

    await removeClassMember(params.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Error removing class member:', error, 'Failed to remove class member');
  }
}
