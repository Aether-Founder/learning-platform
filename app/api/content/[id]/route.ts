import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  getContentById,
  updateContent,
  deleteContent,
} from '@/lib/content';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const content = getContentById(params.id);
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = token ? verifyToken(token) : null;

    if (!content.isPublic && (!user || user.userId !== content.userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const updates = body;

    const content = updateContent(params.id, user.userId, updates);
    if (!content) {
      return NextResponse.json({ error: 'Content not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const success = deleteContent(params.id, user.userId);
    if (!success) {
      return NextResponse.json({ error: 'Content not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}
