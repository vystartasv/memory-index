import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { resolveEmbeddingProvider } from './embedding.js';
import { collectDocuments, indexDocuments } from './indexer.js';
import { search } from './search.js';
import { MemoryStore } from './store.js';

const projectRoot = process.cwd();
const dataDir = join(projectRoot, '.memory-index');
const dbPath = join(dataDir, 'index.sqlite');
mkdirSync(dataDir, { recursive: true });

const DEFAULT_MODELS = [
  'bge-m3-mlx-4bit',
  'bge-m3-mlx-8bit',
];

async function main() {
  const [, , command, ...args] = process.argv;
  const provider = await resolveEmbeddingProvider(DEFAULT_MODELS);
  const store = new MemoryStore(dbPath);

  try {
    if (command === 'index') {
      const cwd = args[0] ?? '/Users/vilius/.openclaw/workspace';
      const docs = collectDocuments({ cwd, patterns: ['MEMORY.md', 'memory/*.md'] });
      await indexDocuments(store, provider, docs);
      console.log(`Indexed ${docs.length} document(s) with ${provider.name}`);
      return;
    }

    if (command === 'search') {
      const query = args.join(' ').trim();
      const results = await search(store, provider, query || 'default memory query');
      console.log(JSON.stringify({ provider: provider.name, results }, null, 2));
      return;
    }

    if (command === 'benchmark') {
      const query = args.join(' ').trim() || 'telegram delivery rules';
      for (const model of DEFAULT_MODELS) {
        const p = await resolveEmbeddingProvider([model]);
        const start = performance.now();
        await p.embed(query);
        const duration = performance.now() - start;
        console.log(JSON.stringify({ model: p.name, ms: Number(duration.toFixed(1)) }));
      }
      return;
    }

    console.log('Usage: npm run index -- <workspace> | npm run search -- <query> | npm run benchmark -- <query>');
  } finally {
    store.close();
  }
}

main();
