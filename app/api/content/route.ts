import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { badRequest, serverError } from '@/lib/api/responses';
import {
  getContentByUserId,
  createContent,
  getPublicContent,
  searchContent,
  getContentByType,
} from '@/lib/content';

const CONTENT_TYPES = ['study_set', 'notes', 'reference'] as const;
type ContentType = (typeof CONTENT_TYPES)[number];

const isContentType = (value: string | null): value is ContentType =>
  CONTENT_TYPES.includes(value as ContentType);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type');
    const publicOnly = searchParams.get('public') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (publicOnly) {
      return NextResponse.json({ content: getPublicContent(limit, offset) });
    }

    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const { userId } = auth.user;

    let content;
    if (query) {
      content = searchContent(userId, query, limit);
    } else if (isContentType(type)) {
      content = getContentByType(userId, type);
    } else {
      content = getContentByUserId(userId);
    }

    return NextResponse.json({ content });
  } catch (error) {
    return serverError('Error fetching content:', error, 'Failed to fetch content');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const { title, type, data, description, tags, isPublic } = await request.json();

    if (!title || !type || !data) {
      return badRequest('Missing required fields');
    }

    if (!isContentType(type)) {
      return badRequest('Invalid content type');
    }

    const content = createContent(
      auth.user.userId,
      title,
      type,
      data,
      description,
      tags,
      isPublic || false
    );

    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    return serverError('Error creating content:', error, 'Failed to create content');
  }
}
