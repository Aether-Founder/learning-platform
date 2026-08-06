export interface DocumentChunk {
  id: string;
  sourceName: string;
  content: string;
  chunkIndex: number;
}

export function chunkTextDocument(text: string, sourceName: string, maxChunkSize = 500): DocumentChunk[] {
  const words = text.split(/\s+/);
  const chunks: DocumentChunk[] = [];
  let currentChunk: string[] = [];

  words.forEach((word) => {
    currentChunk.push(word);
    if (currentChunk.join(' ').length >= maxChunkSize) {
      chunks.push({
        id: `${sourceName}-chunk-${chunks.length}`,
        sourceName,
        content: currentChunk.join(' '),
        chunkIndex: chunks.length,
      });
      currentChunk = [];
    }
  });

  if (currentChunk.length > 0) {
    chunks.push({
      id: `${sourceName}-chunk-${chunks.length}`,
      sourceName,
      content: currentChunk.join(' '),
      chunkIndex: chunks.length,
    });
  }

  return chunks;
}
