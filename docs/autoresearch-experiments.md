# Autoresearch Experiments for Memory Hardening

## Priority goal

Map every stage where memory is:
- ingested
- chunked
- embedded
- stored
- updated
- searched
- recalled
- surfaced back to the agent

## Experiment families

### MR-001 Chunking boundaries
- compare heading-based vs paragraph-based vs fixed-window chunking
- measure recall quality and noise rate

### MR-002 Metadata noise suppression
- compare transcript-heavy chunks with/without metadata penalties
- measure false-positive reduction

### MR-003 Embedding model tradeoff
- compare `bge-m3-mlx-4bit` vs `bge-m3-mlx-8bit`
- measure latency, recall quality, and cost/throughput tradeoff

### MR-004 Lexical/semantic score weighting
- test different merge weights
- identify best ranking balance for personal memory queries

### MR-005 Storage persistence and incremental reindexing
- test changed-file-only reindex vs full reindex
- measure correctness and speed

### MR-006 Save vs unsaved boundary
- compare information already promoted into `MEMORY.md` vs still only in daily notes
- measure recall priority and miss rate

### MR-007 Retrieval cutoff tuning
- top-k shortlist size before semantic rerank
- measure latency vs answer quality

### MR-008 Recall-to-surface formatting
- compare short snippets vs richer excerpts with headings/line refs
- measure downstream usefulness in agent responses

### MR-009 Recall robustness under gateway/session resets
- confirm local memory recall survives session churn and restart conditions

### MR-010 Source-priority rules
- compare weighting of `MEMORY.md`, daily memory files, and transcripts
- tune for durable memory over noisy chat artifacts

## Output standard

Each experiment should record:
- hypothesis
- variable changed
- fixed conditions
- sample queries
- latency
- quality notes
- winner
- recommended default
