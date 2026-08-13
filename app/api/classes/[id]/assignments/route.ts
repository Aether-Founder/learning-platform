import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndLoad } from '@/lib/api/ownership';
import { badRequest, serverError } from '@/lib/api/responses';
import { getClassById, createAssignment, getAssignmentsByClass } from '@/lib/classes';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await authenticateAndLoad(request, () => getClassById(params.id), {
      notFoundMessage: 'Class not found',
    });
    if ('response' in result) return result.response;

    const assignments = await getAssignmentsByClass(params.id);

    return NextResponse.json({ assignments });
  } catch (error) {
    return serverError('Error fetching assignments:', error, 'Failed to fetch assignments');
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await authenticateAndLoad(request, () => getClassById(params.id), {
      notFoundMessage: 'Class not found',
      ownerId: (classData) => classData.teacherId,
    });
    if ('response' in result) return result.response;

    const body = await request.json();
    const { studySetId, title, description, dueDate } = body;

    if (!studySetId || !title) {
      return badRequest('Study set ID and title are required');
    }

    const assignment = await createAssignment(
      params.id,
      studySetId,
      title,
      description,
      dueDate ? new Date(dueDate) : undefined
    );

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    return serverError('Error creating assignment:', error, 'Failed to create assignment');
  }
}
