import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { globSync } from 'glob';
import { chunkDocument } from './chunking.js';
import { EmbeddingProvider } from './embedding.js';
import { tokenize } from './scoring.js';
import { MemoryStore } from './store.js';
import { SourceDocument } from './types.js';

export interface IndexOptions {
  cwd: string;
  patterns: string[];
}

export function collectDocuments(options: IndexOptions): SourceDocument[] {
  const paths = options.patterns.flatMap((pattern) => globSync(pattern, { cwd: options.cwd, absolute: true, nodir: true }));
  return Array.from(new Set(paths)).map((path) => {
    const stat = statSync(path);
    const content = readFileSync(path, 'utf8');
    return { path, content, mtimeMs: stat.mtimeMs };
  });
}

export async function indexDocuments(store: MemoryStore, provider: EmbeddingProvider, documents: SourceDocument[]): Promise<void> {
  for (const document of documents) {
    const chunks = chunkDocument(document);
    const enriched = await Promise.all(chunks.map(async (chunk) => ({
      ...chunk,
      contentHash: createHash('sha1').update(chunk.content).digest('hex'),
      lexicalBlob: tokenize(`${chunk.heading ?? ''} ${chunk.content}`).join(' '),
      embedding: await provider.embed(chunk.content),
    })));
    store.replaceChunks(document.path, enriched);
  }
}
