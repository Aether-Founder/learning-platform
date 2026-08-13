import { describe, it, expect } from 'vitest';
import { schoolOsTemplate } from '@/lib/templates/school-os';

type TemplatePage = {
  id: string;
  name: string;
  type: string;
  children?: TemplatePage[];
  databases?: { name: string; properties: { name: string; type: string; options?: string[] }[] }[];
};

const pages = schoolOsTemplate.structure.pages as TemplatePage[];

function flatten(nodes: TemplatePage[]): TemplatePage[] {
  return nodes.flatMap((node) => [node, ...flatten((node.children ?? []) as TemplatePage[])]);
}

describe('templates/school-os', () => {
  it('is a named template with pages', () => {
    expect(schoolOsTemplate.name).toBe('School OS 2026-2027');
    expect(schoolOsTemplate.description.trim()).not.toBe('');
    expect(pages.length).toBeGreaterThan(0);
  });

  it('has unique page ids across the tree', () => {
    const ids = flatten(pages).map((page) => page.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes the core study pages', () => {
    const ids = flatten(pages).map((page) => page.id);
    expect(ids).toContain('inbox');
    expect(ids).toContain('taken');
  });

  it('describes every database property with a type', () => {
    for (const page of flatten(pages)) {
      for (const database of page.databases ?? []) {
        expect(database.properties.length).toBeGreaterThan(0);
        for (const property of database.properties) {
          expect(property.name.trim()).not.toBe('');
          expect(property.type.trim()).not.toBe('');
          if (property.options) {
            expect(property.options.length).toBeGreaterThan(0);
            expect(new Set(property.options).size).toBe(property.options.length);
          }
        }
      }
    }
  });
});
