import { NextRequest, NextResponse } from 'next/server';
import {
  CONTENT_CORS_HEADERS,
  jsonToPlainText,
  readContentPage,
  sanitizePageName,
} from '@/lib/api/content-files';
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

    // Structured plain text so AI clients can consume the page directly
    return new NextResponse(jsonToPlainText(jsonData), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...CONTENT_CORS_HEADERS,
      },
    });
  } catch (error) {
    return serverError('Error serving LLM content:', error, 'Failed to load content');
  }
}
