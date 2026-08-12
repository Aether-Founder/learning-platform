import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats info logs with level and message', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('hello');
    expect(spy).toHaveBeenCalledTimes(1);
    const arg = spy.mock.calls[0][0] as string;
    expect(arg).toContain('[INFO]');
    expect(arg).toContain('hello');
  });

  it('includes serialized context', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('request', { route: '/api/test', userId: 'u1', status: 200 });
    const arg = spy.mock.calls[0][0] as string;
    expect(arg).toContain('"route":"/api/test"');
    expect(arg).toContain('"userId":"u1"');
    expect(arg).toContain('"status":200');
  });

  it('logs warnings to console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('careful');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
  });

  it('logs errors with error details', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('boom');
    logger.error('failed', error);
    expect(spy).toHaveBeenCalledTimes(1);
    const arg = spy.mock.calls[0][0] as string;
    expect(arg).toContain('[ERROR]');
    expect(arg).toContain('"message":"boom"');
  });

  it('logs errors without an error object', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('failed', undefined, { userId: 'u1' });
    const arg = spy.mock.calls[0][0] as string;
    expect(arg).toContain('"userId":"u1"');
  });

  it('suppresses debug logs in production', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    logger.debug('hidden');
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('emits debug logs outside production', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'test');
    logger.debug('visible');
    expect(spy).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });
});
