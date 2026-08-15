import { describe, it, expect } from 'vitest';
import { SUBJECTS, countSets, findSubject, resolvePath, type TreeNode } from '@/lib/aether-data';

describe('aether-data', () => {
  describe('SUBJECTS', () => {
    it('has unique slugs and sane progress counters', () => {
      const slugs = SUBJECTS.map((subject) => subject.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      expect(
        SUBJECTS.every(
          (subject) =>
            subject.topicsDone <= subject.topics &&
            subject.mastery >= 0 &&
            subject.mastery <= 100
        )
      ).toBe(true);
    });
  });

  describe('findSubject', () => {
    it('finds a subject by slug', () => {
      expect(findSubject('nederlands')?.name).toBe('Nederlands');
    });

    it('returns undefined for an unknown slug', () => {
      expect(findSubject('bestaat-niet')).toBeUndefined();
      expect(findSubject('')).toBeUndefined();
    });
  });

  describe('resolvePath', () => {
    it('returns an empty trail for an unknown subject', () => {
      expect(resolvePath(['bestaat-niet'])).toEqual({ trail: [] });
      expect(resolvePath([])).toEqual({ trail: [] });
    });

    it('returns the subject with an empty trail when no children are requested', () => {
      const resolved = resolvePath(['nederlands']);
      expect(resolved.subject?.slug).toBe('nederlands');
      expect(resolved.trail).toEqual([]);
      expect(resolved.node).toBeUndefined();
    });

    it('walks nested folders and returns the trail', () => {
      const subject = findSubject('nederlands');
      const folder = subject?.children[0] as TreeNode;
      const child = folder.children?.[0] as TreeNode;

      const resolved = resolvePath(['nederlands', folder.slug, child.slug]);
      expect(resolved.trail.map((node) => node.slug)).toEqual([folder.slug, child.slug]);
      expect(resolved.node?.slug).toBe(child.slug);
    });

    it('stops at the last valid ancestor for an unknown child', () => {
      const folder = findSubject('nederlands')?.children[0] as TreeNode;
      const resolved = resolvePath(['nederlands', folder.slug, 'bestaat-niet']);
      expect(resolved.subject?.slug).toBe('nederlands');
      expect(resolved.node).toBeUndefined();
      expect(resolved.trail.map((node) => node.slug)).toEqual([folder.slug]);
    });
  });

  describe('countSets', () => {
    it('counts sets recursively', () => {
      const nodes: TreeNode[] = [
        { slug: 'a', name: 'A', kind: 'set' },
        {
          slug: 'b',
          name: 'B',
          kind: 'folder',
          children: [
            { slug: 'b1', name: 'B1', kind: 'set' },
            { slug: 'b2', name: 'B2', kind: 'folder', children: [{ slug: 'b21', name: 'B21', kind: 'set' }] },
          ],
        },
      ];
      expect(countSets(nodes)).toBe(3);
    });

    it('returns zero without nodes', () => {
      expect(countSets()).toBe(0);
      expect(countSets([])).toBe(0);
      expect(countSets([{ slug: 'a', name: 'A', kind: 'folder' }])).toBe(0);
    });
  });
});
