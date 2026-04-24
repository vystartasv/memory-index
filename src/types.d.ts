export interface SourceDocument {
    path: string;
    content: string;
    mtimeMs: number;
}
export interface ChunkRecord {
    filePath: string;
    chunkIndex: number;
    startLine: number;
    endLine: number;
    heading: string | null;
    content: string;
}
export interface SearchResult {
    path: string;
    startLine: number;
    endLine: number;
    heading: string | null;
    snippet: string;
    lexicalScore: number;
    semanticScore: number;
    score: number;
}
