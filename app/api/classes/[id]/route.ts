import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndLoad } from '@/lib/api/ownership';
import { forbidden, serverError } from '@/lib/api/responses';
import { getClassById, updateClass, deleteClass, getClassesByTeacher } from '@/lib/classes';

const ownedClass = (request: NextRequest, id: string) =>
  authenticateAndLoad(request, () => getClassById(id), {
    notFoundMessage: 'Class not found',
    ownerId: (classData) => classData.teacherId,
  });

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await authenticateAndLoad(request, () => getClassById(params.id), {
      notFoundMessage: 'Class not found',
    });
    if ('response' in result) return result.response;

    // Check if user is teacher or member
    const teacherClasses = await getClassesByTeacher(result.user.userId);
    const isTeacher = teacherClasses.some((c) => c.id === params.id);

    if (!isTeacher && result.resource.teacherId !== result.user.userId) {
      return forbidden();
    }

    return NextResponse.json({ class: result.resource });
  } catch (error) {
    return serverError('Error fetching class:', error, 'Failed to fetch class');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedClass(request, params.id);
    if ('response' in result) return result.response;

    const body = await request.json();
    const { name, description } = body;

    const updatedClass = await updateClass(params.id, name, description);

    return NextResponse.json({ class: updatedClass });
  } catch (error) {
    return serverError('Error updating class:', error, 'Failed to update class');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedClass(request, params.id);
    if ('response' in result) return result.response;

    await deleteClass(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Error deleting class:', error, 'Failed to delete class');
  }
}
