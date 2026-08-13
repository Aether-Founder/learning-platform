import { NextRequest, NextResponse } from 'next/server';
import { readContentPage, sanitizePageName } from '@/lib/api/content-files';
import { badRequest, errorResponse, notFound } from '@/lib/api/responses';

export async function GET(_req: NextRequest, { params }: { params: { page: string } }) {
  const pageName = sanitizePageName(params.page);
  if (!pageName) {
    return badRequest('Invalid page name');
  }

  try {
    const data = await readContentPage(pageName);
    if (data === null) {
      return notFound('Not found');
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return errorResponse('Failed to parse content', 500);
  }
}
