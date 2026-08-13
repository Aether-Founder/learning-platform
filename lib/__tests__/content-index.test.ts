import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import { getContentFiles } from '@/lib/content-index';

describe('getContentFiles', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function stubContentDir(files: Record<string, string>) {
    vi.spyOn(fs, 'readdirSync').mockReturnValue(
      Object.keys(files) as unknown as ReturnType<typeof fs.readdirSync>
    );
    vi.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
      const name = String(filePath).split('/').pop() as string;
      return files[name];
    });
  }

  it('summarises every json file with its metadata', () => {
    stubContentDir({
      'biologie.json': JSON.stringify({
        siteMetadata: { title: 'Biologie', description: 'Cellen' },
      }),
    });
    expect(getContentFiles()).toEqual([
      { pageName: 'biologie', title: 'Biologie', description: 'Cellen' },
    ]);
  });

  it('ignores non-json files', () => {
    stubContentDir({
      'convert.py': 'print("hi")',
      'biologie.json': JSON.stringify({ siteMetadata: { title: 'Biologie' } }),
    });
    expect(getContentFiles().map((file) => file.pageName)).toEqual(['biologie']);
  });

  it('falls back to the file name and a generic description', () => {
    stubContentDir({ 'aardrijkskunde.json': JSON.stringify({}) });
    expect(getContentFiles()).toEqual([
      { pageName: 'aardrijkskunde', title: 'aardrijkskunde', description: 'Study guide' },
    ]);
  });

  it('sorts by title, case- and accent-insensitively', () => {
    stubContentDir({
      'c.json': JSON.stringify({ siteMetadata: { title: 'Économie' } }),
      'a.json': JSON.stringify({ siteMetadata: { title: 'biologie' } }),
      'b.json': JSON.stringify({ siteMetadata: { title: 'Aardrijkskunde' } }),
    });
    expect(getContentFiles().map((file) => file.title)).toEqual([
      'Aardrijkskunde',
      'biologie',
      'Économie',
    ]);
  });

  it('skips files that cannot be parsed', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubContentDir({
      'broken.json': '{not json',
      'ok.json': JSON.stringify({ siteMetadata: { title: 'Ok' } }),
    });
    expect(getContentFiles().map((file) => file.pageName)).toEqual(['ok']);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('reads the real content directory', () => {
    const files = getContentFiles();
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((file) => file.title.length > 0)).toBe(true);
  });
});
