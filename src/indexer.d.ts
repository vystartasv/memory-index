import { EmbeddingProvider } from './embedding.js';
import { MemoryStore } from './store.js';
import { SourceDocument } from './types.js';
export interface IndexOptions {
    cwd: string;
    patterns: string[];
}
export declare function collectDocuments(options: IndexOptions): SourceDocument[];
export declare function indexDocuments(store: MemoryStore, provider: EmbeddingProvider, documents: SourceDocument[]): Promise<void>;
