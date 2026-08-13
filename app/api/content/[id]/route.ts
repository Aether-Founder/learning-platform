import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getOptionalUser, isAuthFailure } from '@/lib/api/auth';
import { notFound, serverError, unauthorized } from '@/lib/api/responses';
import { getContentById, updateContent, deleteContent } from '@/lib/content';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const content = getContentById(params.id);
    if (!content) {
      return notFound('Content not found');
    }

    const user = getOptionalUser(request);

    if (!content.isPublic && (!user || user.userId !== content.userId)) {
      return unauthorized();
    }

    return NextResponse.json({ content });
  } catch (error) {
    return serverError('Error fetching content:', error, 'Failed to fetch content');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const updates = await request.json();

    const content = updateContent(params.id, auth.user.userId, updates);
    if (!content) {
      return notFound('Content not found or unauthorized');
    }

    return NextResponse.json({ content });
  } catch (error) {
    return serverError('Error updating content:', error, 'Failed to update content');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const success = deleteContent(params.id, auth.user.userId);
    if (!success) {
      return notFound('Content not found or unauthorized');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Error deleting content:', error, 'Failed to delete content');
  }
}
