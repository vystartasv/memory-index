import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = '/Users/vilius/.local/share/fnm/node-versions/v22.22.1/installation/lib/node_modules/openclaw/dist';
const sourcePath = new URL('../src/index.ts', import.meta.url);

const entryFile = readdirSync(distDir)
  .filter((name) => /^plugin-entry-.*\.js$/.test(name))
  .sort()
  .at(-1);

if (!entryFile) {
  throw new Error(`Could not find plugin-entry-*.js in ${distDir}`);
}

const entryImportPath = join(distDir, entryFile);
const source = readFileSync(sourcePath, 'utf8');
const updated = source.replace(
  /import \{ t as definePluginEntry \} from '.*\/plugin-entry-[^']+\.js';/,
  `import { t as definePluginEntry } from '${entryImportPath}';`
);

if (source === updated) {
  throw new Error('Failed to rewrite definePluginEntry import in src/index.ts');
}

writeFileSync(sourcePath, updated, 'utf8');
console.log(`Synced OpenClaw plugin entry import to ${entryImportPath}`);
