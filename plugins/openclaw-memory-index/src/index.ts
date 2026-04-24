import { Type } from '@sinclair/typebox';
// @ts-expect-error local OpenClaw runtime hashed entry exports minified aliases only
import { t as definePluginEntry } from '/Users/vilius/.local/share/fnm/node-versions/v22.22.1/installation/lib/node_modules/openclaw/dist/plugin-entry-DhR2SXKx.js';
import type { OpenClawPluginApi } from '/Users/vilius/.local/share/fnm/node-versions/v22.22.1/installation/lib/node_modules/openclaw/dist/plugin-sdk/src/plugin-sdk/plugin-entry.d.ts';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { globSync } from 'glob';

const DEFAULT_WORKSPACE = '/Users/vilius/.openclaw/workspace';
const ENTRY_DELIMITER = '\n§\n';
const MEMORY_CHAR_LIMIT = 2200;
const USER_CHAR_LIMIT = 1375;

type MemoryTarget = 'memory' | 'user';
type SourceDocument = { path: string; content: string; mtimeMs: number };
type SearchRow = { session_key: string; path: string; kind: string; title: string; body: string; updated_at: number };

class SearchStore {
  readonly db: Database.Database;
  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY,
        session_key TEXT NOT NULL,
        path TEXT NOT NULL,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(session_key, path)
      );
    `);
    this.db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(session_key UNINDEXED, path UNINDEXED, kind UNINDEXED, title, body, tokenize = 'porter unicode61');`);
  }
  replaceAll(rows: SearchRow[]) {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM documents').run();
      this.db.prepare('DELETE FROM documents_fts').run();
      const insert = this.db.prepare('INSERT INTO documents (session_key, path, kind, title, body, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
      const insertFts = this.db.prepare('INSERT INTO documents_fts (session_key, path, kind, title, body) VALUES (?, ?, ?, ?, ?)');
      for (const row of rows) {
        insert.run(row.session_key, row.path, row.kind, row.title, row.body, row.updated_at);
        insertFts.run(row.session_key, row.path, row.kind, row.title, row.body);
      }
    });
    tx();
  }
  search(query: string, limit = 8): SearchRow[] {
    const q = ftsQuery(query);
    if (!q) return [];
    return this.db.prepare(`
      SELECT d.session_key, d.path, d.kind, d.title, d.body, d.updated_at
      FROM documents_fts f
      JOIN documents d
        ON d.session_key = f.session_key AND d.path = f.path
      WHERE documents_fts MATCH ?
      ORDER BY bm25(documents_fts)
      LIMIT ?
    `).all(q, limit) as SearchRow[];
  }
  close() { this.db.close(); }
}

function dirname(path: string): string { const i = path.lastIndexOf('/'); return i >= 0 ? path.slice(0, i) : '.'; }
function resolveWorkspace(ctx: { workspaceDir?: string }, workspace?: string) { return workspace || ctx.workspaceDir || DEFAULT_WORKSPACE; }
function resolvePluginDataDir(api: { pluginDir?: string }) { return `${api.pluginDir || DEFAULT_WORKSPACE}/.memory-index-plugin`; }
function memoryFile(workspace: string, target: MemoryTarget) { return `${workspace}/${target === 'user' ? 'USER.md' : 'MEMORY.md'}`; }
function tokenize(text: string) { return text.toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean); }
function ftsQuery(query: string) { const toks = tokenize(query); return toks.length ? toks.map(t => `"${t.replace(/"/g, '""')}"`).join(' OR ') : ''; }
function readEntries(path: string): string[] {
  try {
    const raw = readFileSync(path, 'utf8').trim();
    if (!raw) return [];
    return raw.split(ENTRY_DELIMITER).map(x => x.trim()).filter(Boolean);
  } catch { return []; }
}
function writeEntries(path: string, entries: string[]) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, entries.join(ENTRY_DELIMITER) + (entries.length ? '\n' : ''), 'utf8');
}
function renderMemoryBlock(label: string, entries: string[], limit: number) {
  const joined = entries.join(ENTRY_DELIMITER);
  const used = joined.length;
  const pct = Math.min(100, Math.round((used / Math.max(limit,1)) * 100));
  return `══════════════════════════════════════════════\n${label} [${pct}% — ${used.toLocaleString()}/${limit.toLocaleString()} chars]\n══════════════════════════════════════════════\n${joined}`;
}
function collectDocuments(workspace: string): SourceDocument[] {
  const patterns = ['MEMORY.md', 'USER.md', 'memory/*.md'];
  const paths = patterns.flatMap(pattern => globSync(pattern, { cwd: workspace, absolute: true, nodir: true }));
  return Array.from(new Set(paths)).map(path => {
    const stat = statSync(path);
    const content = readFileSync(path, 'utf8');
    return { path, content, mtimeMs: stat.mtimeMs };
  });
}
function buildRows(workspace: string): SearchRow[] {
  const docs = collectDocuments(workspace);
  return docs.map(doc => ({
    session_key: 'workspace',
    path: doc.path,
    kind: doc.path.endsWith('USER.md') ? 'user' : doc.path.endsWith('MEMORY.md') ? 'memory' : 'daily-note',
    title: doc.path.split('/').pop() || doc.path,
    body: doc.content,
    updated_at: Math.floor(doc.mtimeMs),
  }));
}
function statusMessage(kind: 'degraded' | 'healthy', reason: string, remediation: string) {
  return `[Claw memory-index-local] status=${kind}; reason=${reason}; remediation=${remediation}`;
}

function buildPromptSection({ citationsMode }: { availableTools: Set<string>; citationsMode?: string }) {
  const lines = [
    '## Memory Recall',
    'Use memory_index_search for long-term recall. Core MEMORY.md/USER.md remains the safe baseline if search is degraded.'
  ];
  if (citationsMode === 'off') lines.push('Citations are disabled unless explicitly requested.');
  lines.push('');
  return lines;
}
const memoryRuntime = {
  async getMemorySearchManager() { return { manager: null, error: 'memory-index-local exposes direct tools only.' }; },
  resolveMemoryBackendConfig() { return { backend: 'builtin' as const }; }
};
const publicArtifacts = { async listArtifacts() { return []; } };

export default definePluginEntry({
  id: 'memory-index-local',
  name: 'Memory Index Local',
  description: 'Safe core memory files plus separate SQLite FTS long-term recall for OpenClaw.',
  kind: 'memory',
  register(api: OpenClawPluginApi) {
    api.registerMemoryCapability({ promptBuilder: buildPromptSection, flushPlanResolver: () => null, runtime: memoryRuntime, publicArtifacts });

    api.registerTool({
      name: 'memory_index_reindex',
      label: 'Memory Index Reindex',
      description: 'Rebuild the separate long-term search DB from MEMORY.md, USER.md, and daily memory notes.',
      parameters: Type.Object({ workspace: Type.Optional(Type.String()) }),
      execute: async (_id: string, params: { workspace?: string }, _signal?: AbortSignal, ctx?: { workspaceDir?: string }) => {
        try {
          const workspace = resolveWorkspace(ctx ?? {}, params.workspace);
          const dbPath = `${resolvePluginDataDir(api as { pluginDir?: string })}/search.sqlite`;
          const store = new SearchStore(dbPath);
          try {
            const rows = buildRows(workspace);
            store.replaceAll(rows);
            return { content: [{ type: 'text' as const, text: 'SUCCESS' }], details: { count: rows.length, dbPath } };
          } finally { store.close(); }
        } catch (error) {
          const message = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error);
          return { content: [{ type: 'text' as const, text: `FAIL\n${message}\n${statusMessage('degraded', error instanceof Error ? error.message : String(error), 'Run memory_index_reindex again after checking plugin storage path and SQLite availability.')}` }], details: { error: true, message } };
        }
      }
    } as any);

    api.registerTool({
      name: 'memory_index_search',
      label: 'Memory Index Search',
      description: 'Search long-term recall across MEMORY.md, USER.md, and daily memory notes using SQLite FTS5.',
      parameters: Type.Object({ query: Type.String(), limit: Type.Optional(Type.Number()), workspace: Type.Optional(Type.String()), refresh: Type.Optional(Type.Boolean()) }),
      execute: async (_id: string, params: { query: string; limit?: number; workspace?: string; refresh?: boolean }, _signal?: AbortSignal, ctx?: { workspaceDir?: string }) => {
        try {
          const workspace = resolveWorkspace(ctx ?? {}, params.workspace);
          const dbPath = `${resolvePluginDataDir(api as { pluginDir?: string })}/search.sqlite`;
          const store = new SearchStore(dbPath);
          try {
            if (params.refresh) store.replaceAll(buildRows(workspace));
            const results = store.search(params.query, params.limit && params.limit > 0 ? Math.floor(params.limit) : 8);
            if (!results.length) {
              return { content: [{ type: 'text' as const, text: 'No relevant memory results found.' }], details: { results: [] } };
            }
            return { content: [{ type: 'text' as const, text: results.map((r, i) => `${i + 1}. ${r.path} — ${r.body.slice(0, 240).replace(/\n/g, ' ')}`).join('\n') }], details: { results } };
          } finally { store.close(); }
        } catch (error) {
          return { content: [{ type: 'text' as const, text: statusMessage('degraded', error instanceof Error ? error.message : String(error), 'Core MEMORY.md and USER.md remain available; rerun reindex after remediation.') }], details: { error: true } };
        }
      }
    } as any);

    api.registerTool({
      name: 'memory_tool',
      label: 'Memory Tool',
      description: 'Manage small curated core memory files (MEMORY.md and USER.md).',
      parameters: Type.Object({
        action: Type.Union([Type.Literal('add'), Type.Literal('replace'), Type.Literal('remove'), Type.Literal('read')]),
        target: Type.Union([Type.Literal('memory'), Type.Literal('user')]),
        content: Type.Optional(Type.String()),
        old_text: Type.Optional(Type.String()),
        workspace: Type.Optional(Type.String())
      }),
      execute: async (_id: string, params: { action: 'add'|'replace'|'remove'|'read'; target: MemoryTarget; content?: string; old_text?: string; workspace?: string }, _signal?: AbortSignal, ctx?: { workspaceDir?: string }) => {
        try {
          const workspace = resolveWorkspace(ctx ?? {}, params.workspace);
          const path = memoryFile(workspace, params.target);
          const entries = readEntries(path);
          const limit = params.target === 'user' ? USER_CHAR_LIMIT : MEMORY_CHAR_LIMIT;
          if (params.action === 'read') {
            return { content: [{ type: 'text' as const, text: renderMemoryBlock(params.target === 'user' ? 'USER PROFILE' : 'MEMORY', entries, limit) }], details: { entries } };
          }
          if (params.action === 'add') {
            const content = (params.content || '').trim();
            if (!content) throw new Error('Content cannot be empty');
            if (entries.includes(content)) return { content: [{ type: 'text' as const, text: 'Entry already exists (no duplicate added).' }], details: { entries } };
            const next = [...entries, content];
            if (next.join(ENTRY_DELIMITER).length > limit) throw new Error(`Memory at capacity for ${params.target}`);
            writeEntries(path, next);
            return { content: [{ type: 'text' as const, text: 'Added.' }], details: { entries: next } };
          }
          const needle = (params.old_text || '').trim();
          if (!needle) throw new Error('old_text is required');
          const matches = entries.filter(e => e.includes(needle));
          if (matches.length !== 1) throw new Error(matches.length ? 'old_text matched multiple entries' : 'old_text did not match any entry');
          const idx = entries.findIndex(e => e === matches[0]);
          const next = [...entries];
          if (params.action === 'remove') next.splice(idx, 1);
          else {
            const content = (params.content || '').trim();
            if (!content) throw new Error('Content cannot be empty');
            next[idx] = content;
            if (next.join(ENTRY_DELIMITER).length > limit) throw new Error(`Memory at capacity for ${params.target}`);
          }
          writeEntries(path, next);
          return { content: [{ type: 'text' as const, text: params.action === 'remove' ? 'Removed.' : 'Replaced.' }], details: { entries: next } };
        } catch (error) {
          return { content: [{ type: 'text' as const, text: statusMessage('degraded', error instanceof Error ? error.message : String(error), 'Core memory edit failed; inspect MEMORY.md/USER.md permissions and content size.') }], details: { error: true } };
        }
      }
    } as any);
  }
});
