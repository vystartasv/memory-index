import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
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

export class MemoryStore {
  readonly db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY,
        path TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        heading TEXT,
        content TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        lexical_blob TEXT NOT NULL,
        embedding_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(path, chunk_index)
      );
      CREATE INDEX IF NOT EXISTS idx_chunks_path ON chunks(path);
    `);
  }

  replaceChunks(path: string, rows: Array<ChunkRecord & { contentHash: string; lexicalBlob: string; embedding: number[] }>): void {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM chunks WHERE path = ?').run(path);
      const insert = this.db.prepare(`
        INSERT INTO chunks (path, chunk_index, start_line, end_line, heading, content, content_hash, lexical_blob, embedding_json, updated_at)
        VALUES (@path, @chunkIndex, @startLine, @endLine, @heading, @content, @contentHash, @lexicalBlob, @embeddingJson, @updatedAt)
      `);
      const now = Date.now();
      for (const row of rows) {
        insert.run({
          path: row.filePath,
          chunkIndex: row.chunkIndex,
          startLine: row.startLine,
          endLine: row.endLine,
          heading: row.heading,
          content: row.content,
          contentHash: row.contentHash,
          lexicalBlob: row.lexicalBlob,
          embeddingJson: JSON.stringify(row.embedding),
          updatedAt: now,
        });
      }
    });
    tx();
  }

  allChunks(): StoredChunk[] {
    const rows = this.db.prepare('SELECT path, start_line as startLine, end_line as endLine, heading, content, lexical_blob as lexicalBlob, embedding_json as embeddingJson FROM chunks').all() as Array<any>;
    return rows.map((row) => ({ ...row, embedding: JSON.parse(row.embeddingJson) }));
  }

  lexicalCandidates(queryTokens: string[], limit = 80): StoredChunk[] {
    const rows = this.allChunks();
    const scored = rows.map((row) => ({
      row,
      hits: queryTokens.filter((token) => row.lexicalBlob.includes(token)).length,
    })).filter((item) => item.hits > 0);

    return scored
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit)
      .map((item) => item.row);
  }

  close(): void {
    this.db.close();
  }
}
