import { describe, it, expect } from 'vitest';
import { simplifyText } from '@/lib/accessibility/simplify';

describe('simplifyText', () => {
  it('collapses whitespace and trims at every level', () => {
    expect(simplifyText('  veel    spaties\ten tabs  ', 'advanced')).toBe('veel spaties en tabs');
    expect(simplifyText('  veel    spaties  ', 'standard')).toBe('veel spaties');
    expect(simplifyText('  veel    spaties  ', 'simplified')).toBe('veel spaties');
  });

  it('leaves difficult words untouched at standard and advanced level', () => {
    const text = 'Derhalve moeten wij dit implementeren.';
    expect(simplifyText(text, 'standard')).toBe(text);
    expect(simplifyText(text, 'advanced')).toBe(text);
  });

  it('replaces difficult words at simplified level', () => {
    expect(simplifyText('Derhalve moeten wij dit implementeren.', 'simplified')).toBe(
      'dus moeten wij dit uitvoeren.'
    );
    expect(simplifyText('Consequently it takes approximately an hour.', 'simplified')).toBe(
      'so it takes about an hour.'
    );
  });

  it('only replaces whole words', () => {
    expect(simplifyText('benutten benuttenswaardig', 'simplified')).toBe(
      'gebruiken benuttenswaardig'
    );
  });

  it('breaks up very long sentences at simplified level', () => {
    const long = `${'woord '.repeat(25)}, en dan verder met de rest van de zin.`;
    const simplified = simplifyText(long, 'simplified');
    expect(simplified).toContain('.\n');
    expect(simplifyText(long, 'standard')).not.toContain('.\n');
  });

  it('leaves short sentences intact', () => {
    expect(simplifyText('Kort, en bondig.', 'simplified')).toBe('Kort, en bondig.');
  });

  it('handles empty input', () => {
    expect(simplifyText('', 'simplified')).toBe('');
  });
});
