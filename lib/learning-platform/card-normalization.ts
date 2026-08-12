import type { Term } from '@/types/learning-platform';

export interface NormalizedCard {
  id?: string;
  front: string;
  back: string;
  cardType: 'basic' | 'cloze' | 'mcq';
  imageUrl?: string;
  audioUrl?: string;
  tags: string[];
  clozeText?: string;
  isDuplicate?: boolean;
}

/**
 * Normalizes input raw cards and flags duplicates based on normalized front text.
 */
export function normalizeAndDeduplicateCards(rawCards: Partial<Term>[]): NormalizedCard[] {
  const seenFronts = new Set<string>();

  return rawCards.map((card) => {
    const front = (card.front || card.term || '').trim();
    const back = (card.back || card.definition || '').trim();
    const key = front.toLowerCase();

    const isDuplicate = seenFronts.has(key);
    if (front) {
      seenFronts.add(key);
    }

    return {
      id: card.id,
      front,
      back,
      cardType: (card.cardType as any) || 'basic',
      imageUrl: card.image,
      audioUrl: card.audio,
      tags: Array.isArray(card.tags) ? card.tags : [],
      clozeText: card.clozeText,
      isDuplicate,
    };
  });
}
