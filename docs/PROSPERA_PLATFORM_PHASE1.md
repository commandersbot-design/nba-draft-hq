# Prospera Platform Phase 1

This document describes the safest integration path for Prospera's production-minded ingestion and modeling system.

## Current repo assessment

### What already exists

- `src/` is the current React/Vite frontend application.
- `scripts/server.js` is a legacy local HTTP server that talks directly to SQLite.
- `database/schema.sql` and `database/seeds.sql` define the original scouting schema.
- `scripts/ingestion/` contains the newer historical/source ingestion work.
- `scripts/lib/db.js` is the cleanest current DB utility and should remain the local SQLite access layer for new scripts until a fuller query layer is introduced.

### What should remain untouched for now

- the current frontend rendering model in `src/`
- the current board/profile/compare UI structure
- the working historical ingestion flow in `scripts/ingestion/`
- the original scoring model and current scouting traits/risk tables

## Safest integration plan

Instead of refactoring the current app into a brand-new architecture, add a parallel platform foundation:

- `src/platform/`
  - backend/data-platform contracts and configs
  - connector interfaces
  - normalization and modeling scaffolding
- `scripts/platform/`
  - CLI entrypoints and local admin scripts
- `database/migrations/2026-04-12-platform-foundation.sql`
  - new platform tables
- `database/seeds/2026-04-12-platform-vocabularies.sql`
  - controlled vocabulary seeds

This keeps the current app running while the platform layer grows beside it.

## Phase 1 deliverables

Phase 1 does not replace the current app. It adds:

1. platform schema foundation
2. platform vocabulary seeds
3. source catalog and compliance metadata
4. connector scaffolding for primary, supplementary, and manual sources
5. platform CLI scaffolding
6. architecture docs

## What is ready after Phase 1

- DB tables exist for the broader ingestion/modeling system
- source connectors have clean contracts
- CSV import paths exist for manual/vendor workflows
- platform commands can be invoked without touching the current UI
- the project is ready for live connector implementation in Phase 2

## What is intentionally blocked until Phase 2

- real live CollegeBasketballData sync
- real live NBA.com combine sync
- entity resolution promotion into platform tables
- derived metrics computation
- trait/composite/comps generation from platform tables
- frontend API wiring

## Why this approach

- It preserves current functionality.
- It avoids destabilizing the React app.
- It gives a clean upgrade path from local SQLite to Postgres later.
- It keeps compliance-sensitive sources behind adapters and import paths instead of pretending access is stable.
