import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndLoad } from '@/lib/api/ownership';
import { serverError } from '@/lib/api/responses';
import { getHomeworkById, updateHomework, deleteHomework } from '@/lib/homework';

function loadHomework(request: NextRequest, id: string) {
  return authenticateAndLoad(request, () => getHomeworkById(id), {
    ownerId: (homework) => homework.userId,
    notFoundMessage: 'Homework not found',
  });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await loadHomework(request, params.id);
    if ('response' in result) return result.response;

    return NextResponse.json({ homework: result.resource });
  } catch (error) {
    return serverError('Error fetching homework:', error, 'Failed to fetch homework');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await loadHomework(request, params.id);
    if ('response' in result) return result.response;

    const { title, description, subject, dueDate, priority, status, estimatedTime } =
      await request.json();

    const updatedHomework = await updateHomework(
      params.id,
      title,
      description,
      subject,
      dueDate ? new Date(dueDate) : undefined,
      priority,
      status,
      estimatedTime
    );

    return NextResponse.json({ homework: updatedHomework });
  } catch (error) {
    return serverError('Error updating homework:', error, 'Failed to update homework');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await loadHomework(request, params.id);
    if ('response' in result) return result.response;

    await deleteHomework(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Error deleting homework:', error, 'Failed to delete homework');
  }
}
