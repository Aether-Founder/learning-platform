import { NextResponse } from 'next/server';

/** JSON error body shared by every API route. */
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized(message = 'Unauthorized') {
  return errorResponse(message, 401);
}

export function forbidden(message = 'Forbidden') {
  return errorResponse(message, 403);
}

export function notFound(message = 'Not found') {
  return errorResponse(message, 404);
}

export function badRequest(message: string) {
  return errorResponse(message, 400);
}

/** Logs an unexpected route failure and returns the client-facing 500 body. */
export function serverError(logMessage: string, error: unknown, clientMessage: string) {
  console.error(logMessage, error);
  return errorResponse(clientMessage, 500);
}
