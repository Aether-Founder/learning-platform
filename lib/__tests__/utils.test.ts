import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('drops falsy values', () => {
    expect(cn('px-2', false, undefined, null, '')).toBe('px-2');
  });

  it('supports conditional objects and arrays', () => {
    expect(cn(['px-2', { 'text-red-500': true, 'text-blue-500': false }])).toBe(
      'px-2 text-red-500'
    );
  });

  it('lets the last conflicting tailwind class win', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('returns an empty string without input', () => {
    expect(cn()).toBe('');
  });
});
