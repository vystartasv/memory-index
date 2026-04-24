import { EmbeddingProvider } from './embedding.js';
import { cosineSimilarity, lexicalScore, tokenize } from './scoring.js';
import { MemoryStore, StoredChunk } from './store.js';
import { SearchResult } from './types.js';

function pathPenalty(path: string): number {
  if (path.endsWith('MEMORY.md')) return 1.5;
  if (path.includes('/memory/')) return 0.8;
  return -0.5;
}

function noisePenalty(chunk: StoredChunk): number {
  let penalty = 0;
  if (/Session:\s\d{4}-\d{2}-\d{2}/.test(chunk.content)) penalty += 1.5;
  if (chunk.content.includes('Conversation info (untrusted metadata)')) penalty += 1.5;
  if (chunk.content.includes('sender_id')) penalty += 1.2;
  if (chunk.content.includes('chat_id')) penalty += 1.2;
  return penalty;
}

export async function search(store: MemoryStore, provider: EmbeddingProvider, query: string, limit = 8): Promise<SearchResult[]> {
  const queryTokens = tokenize(query);
  const queryEmbedding = await provider.embed(query);
  const lexicalCandidates = store.lexicalCandidates(queryTokens, 120);
  const candidates = lexicalCandidates.length > 0 ? lexicalCandidates : store.allChunks().slice(0, 120);

  const ranked = candidates.map((candidate) => {
    const lScore = lexicalScore(query, candidate.content, candidate.heading);
    const sScore = cosineSimilarity(queryEmbedding, candidate.embedding);
    const score = lScore * 2 + sScore * 8 + pathPenalty(candidate.path) - noisePenalty(candidate);
    return {
      path: candidate.path,
      startLine: candidate.startLine,
      endLine: candidate.endLine,
      heading: candidate.heading,
      snippet: candidate.content.slice(0, 320),
      lexicalScore: Number(lScore.toFixed(3)),
      semanticScore: Number(sScore.toFixed(3)),
      score: Number(score.toFixed(3)),
    };
  });

  return ranked
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
