# Phase 3: API Routes and ZIP Streaming - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 03-api-routes-and-zip-streaming
**Areas discussed:** ZIP streaming, audio naming, error handling, progress reporting, search endpoint

---

## All Areas — Claude's Discretion

User requested all decisions be made at Claude's discretion ("Que sea a tu discreción").

No interactive Q&A was conducted. All decisions were made by Claude based on:
- Existing codebase patterns (api/events/route.ts, hymns service, renderHymnPdf)
- PROJECT.md constraints (server-side ZIP, direct download)
- STATE.md risk flags (Archiver + ReadableStream bridge, Directus file permissions)
- Standard practices for streaming ZIP generation in Next.js

## Claude's Discretion

All areas deferred to Claude:
- ZIP streaming strategy (archiver with streaming response)
- Audio file naming (per-hymn folders with original filenames)
- Error handling (skip-and-note strategy, no full-ZIP failure)
- Progress reporting (implicit via streaming, no SSE/polling)
- Search endpoint design (GET with query params wrapping searchHymns)

## Deferred Ideas

None.
