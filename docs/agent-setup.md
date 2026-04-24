# Agent Setup and Push Guide

## Purpose

This project provides a local-first memory search tool using an OpenAI-compatible embeddings API.

## Environment requirements

- Node.js 22+
- npm
- OpenAI-compatible embeddings endpoint
- embedding model available on that endpoint (default tested: `bge-m3-mlx-4bit`)

## Local setup

```bash
cd ~/Projects/memory-index
npm ci
npm run test
npm run build
npm run index -- /Users/vilius/.openclaw/workspace
npm run search -- "direct responses"
```

## Expected embedding API

The project expects:
- `GET /v1/models`
- `POST /v1/embeddings`

Default endpoint:
- `http://127.0.0.1:8000/v1`

## Agent workflow

1. pull latest
2. run tests
3. run build
4. run benchmark if changing embedding model defaults
5. run index against the target workspace
6. run a few real search queries
7. commit only source/docs/config changes
8. push to `main` or open a PR

## Do not commit

- `node_modules/`
- `dist/`
- `.memory-index/`
- generated SQLite indexes

## Push flow

```bash
git status
npm run test
npm run build
git add .
git commit -m "Your change"
git push
```
