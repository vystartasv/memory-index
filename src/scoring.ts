const TOKEN_RE = /[\p{L}\p{N}_-]+/gu;

export function tokenize(value: string): string[] {
  return Array.from(value.toLowerCase().matchAll(TOKEN_RE), (match) => match[0]);
}

export function lexicalScore(query: string, content: string, heading?: string | null): number {
  const queryTokens = tokenize(query);
  const bodyTokens = tokenize(content);
  const headingTokens = tokenize(heading ?? '');
  const bodySet = new Set(bodyTokens);
  const headingSet = new Set(headingTokens);

  let score = 0;
  for (const token of queryTokens) {
    if (headingSet.has(token)) score += 3;
    if (bodySet.has(token)) score += 1;
  }

  if (content.toLowerCase().includes(query.toLowerCase())) {
    score += 4;
  }

  return score;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
