type SimplificationLevel = 'simplified' | 'standard' | 'advanced';

const SIMPLE_WORDS: Array<[RegExp, string]> = [
  [/\bderhalve\b/gi, 'dus'],
  [/\baangezien\b/gi, 'omdat'],
  [/\bdesalniettemin\b/gi, 'toch'],
  [/\bimplementeren\b/gi, 'uitvoeren'],
  [/\bbenutten\b/gi, 'gebruiken'],
  [/\bcomplexiteit\b/gi, 'moeilijkheid'],
  [/\bconstitueert\b/gi, 'is'],
  [/\bapproximately\b/gi, 'about'],
  [/\bconsequently\b/gi, 'so'],
];

function splitLongSentences(text: string): string {
  return text.replace(/([^.!?\n]{110,}?)[,;]\s+/g, '$1.\n');
}

export function simplifyText(text: string, level: SimplificationLevel): string {
  const normalized = text.replace(/[ \t]+/g, ' ').trim();
  if (level === 'advanced') return normalized;
  if (level === 'standard') return normalized;
  return splitLongSentences(
    SIMPLE_WORDS.reduce(
      (value, [pattern, replacement]) => value.replace(pattern, replacement),
      normalized
    )
  );
}
