import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure } from '@/lib/api/auth';
import { badRequest, serverError } from '@/lib/api/responses';
import { getClassesByTeacher, getClassesByStudent, createClass } from '@/lib/classes';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const userId = auth.user.userId;
    const role = request.nextUrl.searchParams.get('role');

    let classes;
    if (role === 'teacher') {
      classes = await getClassesByTeacher(userId);
    } else if (role === 'student') {
      classes = await getClassesByStudent(userId);
    } else {
      classes = [...(await getClassesByTeacher(userId)), ...(await getClassesByStudent(userId))];
    }

    return NextResponse.json({ classes });
  } catch (error) {
    return serverError('Error fetching classes:', error, 'Failed to fetch classes');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthFailure(auth)) return auth.response;

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return badRequest('Name is required');
    }

    const newClass = await createClass(name, description, auth.user.userId);

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    return serverError('Error creating class:', error, 'Failed to create class');
  }
}
