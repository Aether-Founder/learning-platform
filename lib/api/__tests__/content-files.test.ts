import { describe, it, expect } from 'vitest';
import { jsonToPlainText, sanitizePageName } from '@/lib/api/content-files';

describe('sanitizePageName', () => {
  it('strips characters that could escape the content directory', () => {
    expect(sanitizePageName('../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizePageName('my-page_1')).toBe('my-page_1');
  });
});

describe('jsonToPlainText', () => {
  it('renders primitives', () => {
    expect(jsonToPlainText('hello')).toBe('hello');
    expect(jsonToPlainText(42)).toBe('42');
    expect(jsonToPlainText(null)).toBe('null');
  });

  it('renders empty collections', () => {
    expect(jsonToPlainText([])).toBe('[]');
    expect(jsonToPlainText({})).toBe('{}');
  });

  it('indents nested objects', () => {
    expect(jsonToPlainText({ title: 'Math', meta: { level: 2 } })).toBe(
      'title: Math\nmeta:\n  level: 2'
    );
  });

  it('joins array items on separate lines', () => {
    expect(jsonToPlainText(['a', 'b'])).toBe('a\nb');
  });
});
