# Contributing

Thanks for contributing.

This project is intentionally small and should stay practical.

## Principles

- Prefer simple, dependable changes over clever ones.
- Keep core memory understandable and recoverable.
- Avoid adding complexity unless it clearly earns its keep.
- Keep docs aligned with real behavior.

## Local setup

```bash
cd plugins/openclaw-memory-index
npm install
npm run build
```

## Useful commands

```bash
npm run build
npm run plugin:rebuild
npm run release:prepare
npm run release:pack
```

## Development expectations

- Prefer small PRs.
- Explain architecture-impacting changes clearly.
- If behavior changes, update the README/docs in the same change.
- If code or ideas are borrowed, preserve attribution.
- Do not add process overhead for its own sake.

## Architecture changes

If you want to change the memory model, bias toward:

- file-backed core memory staying simple
- SQLite/FTS search staying separate
- graceful degradation on failure

If a change makes the system harder to reason about, it needs a strong reason.

## Release notes

Before release/publication:

- build passes
- local plugin rebuild/install path works
- docs match shipped behavior
- package metadata is current
