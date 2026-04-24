# Architecture

## Retrieval flow

1. read markdown files
2. split into heading-aware chunks
3. store chunks in SQLite
4. compute lexical features and embeddings
5. search by lexical prefilter + semantic similarity
6. return file/line aware excerpts

## Current embedding mode

The current implementation uses a deterministic hash embedding provider for offline development.
This keeps the project testable while the real OMLX embedding integration is added.

## Planned red-green-refactor loop

- red: write failing tests for real embedding integration and search ranking
- green: add OMLX embedding provider + benchmark CLI
- refactor: optimize chunk caching, ranking weights, and incremental reindexing
