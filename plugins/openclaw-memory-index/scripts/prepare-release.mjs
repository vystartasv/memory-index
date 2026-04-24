import { mkdir, rm, copyFile, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginDir = resolve(__dirname, '..');
const releaseDir = join(pluginDir, 'release');

const pkg = JSON.parse(await readFile(join(pluginDir, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(join(pluginDir, 'openclaw.plugin.json'), 'utf8'));

const version = process.env.RELEASE_VERSION || pkg.version;
const baseName = `${manifest.id}-v${version}`;

await rm(releaseDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });

for (const file of ['README.md', 'openclaw.plugin.json', 'package.json', 'package-lock.json']) {
  await copyFile(join(pluginDir, file), join(releaseDir, file));
}

await execFileAsync('cp', ['-R', join(pluginDir, 'dist'), releaseDir]);

const tarballName = `${baseName}.tgz`;
await execFileAsync('tar', ['-czf', join(pluginDir, tarballName), '-C', releaseDir, '.']);

const releaseMeta = {
  id: manifest.id,
  version,
  tarball: tarballName,
  installExamples: {
    localArchive: `openclaw plugins install ./${tarballName}`,
    npm: `openclaw plugins install ${pkg.name}@${version}`,
    forceLocal: `openclaw plugins install ./${tarballName} --force`
  }
};

await writeFile(join(pluginDir, 'release', 'release.json'), JSON.stringify(releaseMeta, null, 2) + '\n');
console.log(JSON.stringify(releaseMeta, null, 2));
