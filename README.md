# memory-index

Local-first hybrid memory search for Markdown memory files.

## Status

This project now ships a working local-first OpenClaw memory plugin with file-backed core memory and SQLite/FTS5 long-term recall.

### Current capabilities
- plugin-based long-term recall for OpenClaw
- file-backed core memory (`MEMORY.md`, `USER.md`)
- separate SQLite + FTS5 search index
- local-first by default
- rebuild/search tooling for local memory recall

### Current caveat
The current shipped version intentionally favors a smaller, more dependable architecture over a richer experimental memory stack.

## Commands

```bash
npm install
npm run test
npm run build
npm run index -- /Users/vilius/.openclaw/workspace
npm run search -- "telegram delivery rules"
npm run benchmark -- "telegram delivery rules"
```

## Next steps
- improve release polish and packaging hardening
- expand docs and examples
- add lightweight recall improvements only where they clearly earn their keep

## Credits and inspiration

This project was shaped by ideas from:

- [OpenClaw](https://github.com/openclaw/openclaw)
- [Hermes Agent](https://github.com/nousresearch/hermes-agent)
- [OB1](https://github.com/NateBJones-Projects/OB1)

Special thanks to **[@NateBJones-Projects](https://github.com/NateBJones-Projects)** for the steady stream of inspiration and insight around long-term memory design.
