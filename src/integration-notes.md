# OpenClaw Integration Notes

## Current state

This project is validated locally but not yet wired directly into OpenClaw's built-in `memory_search` tool.

## Temporary integration pattern

Use the CLI directly:

```bash
cd ~/Projects/memory-index
npm run index -- /Users/vilius/.openclaw/workspace
npm run search -- "query text"
```

## Permanent integration direction

- wrap the search CLI in an OpenClaw tool or extension
- preserve OpenAI-compatible embeddings endpoint support
- keep the memory storage/index local-first
