import { ChunkRecord, SourceDocument } from './types.js';

export function chunkDocument(document: SourceDocument): ChunkRecord[] {
  const lines = document.content.split(/\r?\n/);
  const chunks: ChunkRecord[] = [];
  let start = 0;
  let currentHeading: string | null = null;

  const flush = (endExclusive: number) => {
    const slice = lines.slice(start, endExclusive);
    const content = slice.join('\n').trim();
    if (!content) return;
    chunks.push({
      filePath: document.path,
      chunkIndex: chunks.length,
      startLine: start + 1,
      endLine: endExclusive,
      heading: currentHeading,
      content,
    });
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const isHeading = /^#{1,6}\s+/.test(line);
    const isBoundary = isHeading || (i - start >= 24 && line.trim() === '');

    if (isBoundary && i > start) {
      flush(i);
      start = i;
    }

    if (isHeading) {
      currentHeading = line.replace(/^#{1,6}\s+/, '').trim();
    }
  }

  flush(lines.length);
  return chunks;
}
