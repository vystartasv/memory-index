import { EmbeddingProvider } from './embedding.js';
import { MemoryStore } from './store.js';
import { SearchResult } from './types.js';
export declare function search(store: MemoryStore, provider: EmbeddingProvider, query: string, limit?: number): Promise<SearchResult[]>;
