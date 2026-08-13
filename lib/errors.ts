import { logger } from './logger';

/** Error thrown when an API request fails or returns a non-2xx status. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** Extract a human readable message from an unknown thrown value. */
export function getErrorMessage(error: unknown, fallback = 'Er is een fout opgetreden'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

function extractApiMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const value = (body as { error: unknown }).error;
    if (typeof value === 'string' && value) return value;
  }
  if (typeof body === 'string' && body) return body;
  return `Request failed with status ${status}`;
}

/**
 * Fetch JSON and throw an {@link ApiError} on transport failures, non-2xx
 * responses, or unparseable payloads, so callers cannot accidentally continue
 * with a failed request.
 */
export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const text = await response.text();

  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(extractApiMessage(body, response.status), response.status, body);
  }

  if (text && typeof body === 'string') {
    throw new ApiError('Response was not valid JSON', response.status, body);
  }

  return body as T;
}

/**
 * Read and parse a JSON value from localStorage. Corrupt or unreadable entries
 * are logged and fall back to `fallback` instead of failing silently.
 */
export function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    logger.warn('Unreadable localStorage entry, using fallback', {
      key,
      reason: getErrorMessage(error),
    });
    return fallback;
  }
}

/**
 * Write a JSON value to localStorage. Returns false (and logs) when storage is
 * unavailable or the quota is exceeded, so callers can react to the failure.
 */
export function writeStoredJson(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.warn('Failed to persist localStorage entry', {
      key,
      reason: getErrorMessage(error),
    });
    return false;
  }
}
