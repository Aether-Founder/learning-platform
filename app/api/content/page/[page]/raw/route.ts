import { NextRequest, NextResponse } from 'next/server';
import { CONTENT_CORS_HEADERS, readContentPage, sanitizePageName } from '@/lib/api/content-files';
import { badRequest, notFound, serverError } from '@/lib/api/responses';

export async function GET(_request: NextRequest, { params }: { params: { page: string } }) {
  try {
    const pageName = sanitizePageName(params.page);
    if (!pageName) {
      return badRequest('Invalid page name');
    }

    const jsonData = await readContentPage(pageName);
    if (jsonData === null) {
      return notFound('Content file not found');
    }

    return NextResponse.json(jsonData, {
      headers: {
        'Content-Type': 'application/json',
        ...CONTENT_CORS_HEADERS,
      },
    });
  } catch (error) {
    return serverError('Error serving raw content:', error, 'Failed to load content');
  }
}
