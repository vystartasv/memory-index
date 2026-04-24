import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HashEmbeddingProvider } from '../src/embedding.js';
import { collectDocuments, indexDocuments } from '../src/indexer.js';
import { search } from '../src/search.js';
import { MemoryStore } from '../src/store.js';

describe('memory search', () => {
  const root = mkdtempSync(join(tmpdir(), 'memory-index-'));
  const workspace = join(root, 'workspace');
  const dbPath = join(root, 'index.sqlite');
  const store = new MemoryStore(dbPath);
  const provider = new HashEmbeddingProvider();

  beforeAll(async () => {
    mkdirSync(join(workspace, 'memory'), { recursive: true });
    writeFileSync(join(workspace, 'MEMORY.md'), '# Preferences\nVilius prefers direct responses and cheapest practical options.\n');
    writeFileSync(join(workspace, 'memory', '2026-04-21.md'), '# Daily\nWorked on autoresearch and Telegram chunk sizes.\nConversation info (untrusted metadata)\n');
    const docs = collectDocuments({ cwd: workspace, patterns: ['MEMORY.md', 'memory/*.md'] });
    await indexDocuments(store, provider, docs);
  });

  afterAll(() => {
    store.close();
    rmSync(root, { recursive: true, force: true });
  });

  it('finds relevant long-term memory results', async () => {
    const results = await search(store, provider, 'direct responses');
    expect(results[0]?.path).toContain('MEMORY.md');
  });

  it('penalizes noisy transcript-like chunks', async () => {
    const results = await search(store, provider, 'telegram chunk sizes');
    expect(results[0]?.path).toContain('2026-04-21.md');
  });
});
