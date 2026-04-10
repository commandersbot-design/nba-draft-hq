# Ingestion System

Prospera now includes a modular ingestion path that extends the existing SQLite + frontend architecture instead of replacing it.

## Sources

- `CollegeBasketballData`
  - intended for player stat lines and game logs
  - current adapter supports live sync when `CBBD_STATS_ENDPOINT` is configured
  - otherwise it falls back to `imports/fixtures/collegebasketballdata-2025.json`

- `BartTorvikDataset`
  - structured dataset import only
  - no scraping
  - reads from `BART_TORVIK_DATASET_PATH` or `imports/fixtures/barttorvik-2025.json`

## New Tables

- `player_stats_raw`
- `player_game_logs_raw`
- `player_stats_normalized`
- `source_sync_log`

## Flow

1. `npm run db:migrate:ingestion`
   - creates ingestion tables

2. `npm run ingest:seed-prospects`
   - syncs current frontend prospects into SQLite `players`

3. `npm run ingest:sync`
   - runs source adapters
   - writes raw stat payloads and game logs
   - writes sync metadata to `source_sync_log`

4. `npm run ingest:transform`
   - combines raw source rows
   - computes percentiles by position group
   - computes stat strengths/weaknesses
   - creates archetype indicators, comparison inputs, and stat cards
   - writes `player_stats_normalized`

5. `npm run ingest:export`
   - exports normalized profile-ready stats into `src/data/profileStats.json`
   - frontend merges that file into the existing player profile system

## Frontend Integration

The React app still reads `src/data/prospects.json` as the base board dataset.

`src/lib/prospectModel.js` now merges:

- authored prospect profile data from `prospects.json`
- generated normalized stat/profile data from `profileStats.json`
- derived fallbacks where neither exists

This preserves the current UI and routing while giving profiles deeper stat context.
