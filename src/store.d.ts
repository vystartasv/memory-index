import Database from 'better-sqlite3';
import { ChunkRecord } from './types.js';
export interface StoredChunk {
    path: string;
    startLine: number;
    endLine: number;
    heading: string | null;
    content: string;
    lexicalBlob: string;
    embedding: number[];
}
export declare class MemoryStore {
    readonly db: Database.Database;
    constructor(dbPath: string);
    replaceChunks(path: string, rows: Array<ChunkRecord & {
        contentHash: string;
        lexicalBlob: string;
        embedding: number[];
    }>): void;
    allChunks(): StoredChunk[];
    lexicalCandidates(queryTokens: string[], limit?: number): StoredChunk[];
    close(): void;
}
