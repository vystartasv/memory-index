# @vystartas/openclaw-memory-plugin

A local-first memory plugin for OpenClaw that keeps core memory simple and adds SQLite/FTS5 long-term recall.

## What problem this solves

OpenClaw's core memory model is intentionally small and curated. That is a strength, but on its own it is not enough for searching older daily notes, recalling prior decisions, or surfacing useful long-term context from local files.

This plugin adds a separate long-term recall layer without replacing the safe core memory model.

## Current architecture

This project deliberately chose the simpler architecture after iterating through heavier ideas:

- **Core memory stays file-backed**
  - `MEMORY.md`
  - `USER.md`
- **Long-term recall is separate**
  - SQLite
  - FTS5
- **Search augments core memory**
  - it does not replace it
- **Failure should degrade safely**
  - if indexing/search breaks, core memory still remains understandable and recoverable

That bias toward simplicity is intentional. The goal is dependable local memory, not an overengineered black box.

## What it provides

Tools:

- `memory_index_reindex` — rebuild the long-term search index
- `memory_index_search` — search long-term recall across memory files
- `memory_tool` — manage the small curated core memory files

## Who this is for

This project is a good fit for:

- OpenClaw users who want **local searchable recall**
- people who already work with `MEMORY.md`, `USER.md`, and daily notes
- users who value **inspectability, recoverability, and local-first design**
- developers who want a small, understandable memory layer they can extend later

## Who should probably skip it

This project is probably **not** the right fit if you want:

- a large autonomous memory graph from day one
- heavy multi-provider memory orchestration
- a hosted memory platform
- a much broader long-term agent system where memory is only one part of the stack

If that is what you want, you may be better served by:

- [Hermes Agent](https://github.com/nousresearch/hermes-agent)
- [OB1](https://github.com/NateBJones-Projects/OB1)

## Why SQLite + FTS5

SQLite was chosen because it is:

- local
- inspectable
- portable
- easy to back up
- good enough for this scale

FTS5 was chosen because it gives fast, practical full-text search without dragging the project into heavier infrastructure too early.

## Why not the earlier heavier design

During implementation, the project explored richer hybrid memory ideas: embeddings, structured layers, and more complex storage behavior. That turned out to be too much complexity for a solid v1.

The main lesson was simple:

> reliable memory beats clever memory.

So the shipped direction is intentionally smaller, safer, and easier to reason about.

## Install

### From local source

```bash
openclaw plugins install .
```

### Rebuild during development

```bash
npm run plugin:rebuild
```

### From release artifact

```bash
openclaw plugins install ./memory-index-local-v0.1.0.tgz
```

### From npm

```bash
openclaw plugins install @vystartas/openclaw-memory-plugin@0.1.0
```

## Development scripts

- `npm run build`
- `npm run plugin:install`
- `npm run plugin:rebuild`
- `npm run release:prepare`
- `npm run release:pack`
- `npm run release:all`

## Notes for development

- The plugin uses a hashed OpenClaw runtime entry file, so the build rewrites that import automatically before compilation.
- The plugin uses `better-sqlite3`, which means native bindings must exist in the **installed plugin directory**, not just the source directory.
- Clean overwrite installs are safer than partial merges when native dependencies change.

## Roadmap

### Near term

- public release polish
- installer/rebuild hardening
- documentation cleanup
- contributing guide
- safer packaging expectations

### Later, if clearly worthwhile

- lightweight categorized memory
- better ranking signals
- optional structured enrichment
- release provenance / signing hardening

## Contributing

This project should stay lightweight to work on.

Expected norms:

- keep setup simple
- prefer small PRs
- keep docs aligned with real behavior
- explain architecture changes clearly
- preserve attribution when borrowing ideas or code
- avoid unnecessary process overhead

A fuller `CONTRIBUTING.md` can follow, but the project should stay practical rather than bureaucratic.

## Credits and inspiration

This project was shaped by ideas from:

- [OpenClaw](https://github.com/openclaw/openclaw)
- [Hermes Agent](https://github.com/nousresearch/hermes-agent)
- [OB1](https://github.com/NateBJones-Projects/OB1)

Special thanks to **[@NateBJones-Projects](https://github.com/NateBJones-Projects)**, whose work on OB1 has provided a steady stream of inspiration, sharp ideas, and useful pressure toward better long-term memory design. Even where this project chose a smaller or different path, that influence helped clarify what was worth keeping and what was unnecessary.

And a smaller personal note: this version exists because Claw was allowed to iterate, break things, learn, and simplify. That mattered. The final shape is better because it stopped trying to be impressive and started trying to be dependable.

## License

[Apache-2.0](./LICENSE)
