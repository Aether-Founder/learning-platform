import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndLoad, loadOwnedResource } from '@/lib/api/ownership';
import { badRequest, serverError } from '@/lib/api/responses';
import { getClassById, getAssignmentById, updateAssignment, deleteAssignment } from '@/lib/classes';

/** Loads the assignment after checking the class exists (and is taught by the caller). */
async function classAssignment(
  request: NextRequest,
  { id, assignmentId }: { id: string; assignmentId: string },
  { requireTeacher }: { requireTeacher: boolean }
) {
  const classResult = await authenticateAndLoad(request, () => getClassById(id), {
    notFoundMessage: 'Class not found',
    ownerId: requireTeacher ? (classData) => classData.teacherId : undefined,
  });
  if ('response' in classResult) return classResult;

  const assignmentResult = await loadOwnedResource(() => getAssignmentById(assignmentId), {
    userId: classResult.user.userId,
    notFoundMessage: 'Assignment not found',
  });
  if ('response' in assignmentResult) return assignmentResult;

  if (assignmentResult.resource.classId !== id) {
    return { response: badRequest('Assignment does not belong to this class') };
  }

  return { assignment: assignmentResult.resource };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const result = await classAssignment(request, params, { requireTeacher: false });
    if ('response' in result) return result.response;

    return NextResponse.json({ assignment: result.assignment });
  } catch (error) {
    return serverError('Error fetching assignment:', error, 'Failed to fetch assignment');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const result = await classAssignment(request, params, { requireTeacher: true });
    if ('response' in result) return result.response;

    const body = await request.json();
    const { title, description, dueDate } = body;

    const updatedAssignment = await updateAssignment(
      params.assignmentId,
      title,
      description,
      dueDate ? new Date(dueDate) : undefined
    );

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    return serverError('Error updating assignment:', error, 'Failed to update assignment');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const result = await classAssignment(request, params, { requireTeacher: true });
    if ('response' in result) return result.response;

    await deleteAssignment(params.assignmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Error deleting assignment:', error, 'Failed to delete assignment');
  }
}
