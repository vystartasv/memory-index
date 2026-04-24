# ClawHub publishing notes

## Package

Primary package:
- `@vystartas/openclaw-memory-plugin`

## Current architecture

This package now ships the simpler, safer memory design:

- file-backed core memory (`MEMORY.md`, `USER.md`)
- separate SQLite + FTS5 long-term recall
- graceful degradation instead of replacing core memory behavior

## Release channels

1. local development install/rebuild
2. GitHub Releases with downloadable build artifacts
3. npm publication
4. later ClawHub submission

## Suggested publish flow

1. bump version
2. run `npm run release:all`
3. verify tarball contents
4. test install from artifact/tarball
5. tag release
6. push tag
7. publish to npm
8. submit to ClawHub later if desired

## Pre-publish checklist

- build passes
- native dependency install path is validated
- `openclaw.plugin.json` is included
- `dist/index.js` is included
- README reflects current shipped architecture
- LICENSE included
- CONTRIBUTING included
- install tested from built package

## Notes

Build provenance/signing should be added later as release hardening, but is not a current blocker.
