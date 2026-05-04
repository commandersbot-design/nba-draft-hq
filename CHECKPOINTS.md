# Checkpoints

## 2026-05-03

### `checkpoint-20260503-222318-scouting-terminal-historical`
- Commit: `13e2ebf`
- Branch: `claude/exciting-hermann-e18d23`
- Live: https://exciting-hermann-e18d23.vercel.app
- Scope: Drop in the dark scouting-terminal artifact as the default UI, build out daily-flow features against it, and backfill the historical archive to 25+ years of NBA drafts.
- Includes:
  - `src/components/ScoutingTerminal.jsx` as the default UI; classic UI reachable via `?classic=1`
  - Watchlist + Compare queue with dedicated Compare page (real side-by-side panels)
  - Per-prospect Notes workspace (per-player, persisted, JSON export)
  - My Board (drag-reorder custom rank, named saved boards, JSON/CSV exports)
  - Tier overrides + custom tags surfaced in Evaluation tab
  - Big Board search + saved views
  - Comparables tab on every profile, ranking historical picks by position fit, height, archetype overlap, age, and outcome
  - Historical archive expanded from 44 hand-authored seed records to 1292 prospects across 26 draft classes (2000-2025) via `scripts/ingestion/fetch-nba-draft-history.js` hitting stats.nba.com
  - `scripts/ingestion/enrich-nba-player-info.js` that backfills position/height/age/career stats per pick (long-running)
- Backup:
  - Local zip: `C:\Users\danud\Desktop\prospera-checkpoint-20260503-222318.zip`

## 2026-04-02

### `checkpoint-20260402-082535-prospera-board`
- Commit: `7261944`
- Scope: Prospera board UI live in the Netlify repo, using the real prospect list supplied for the 2026 board.
- Includes:
  - React app replaced with the Prospera board workflow
  - Real board data in `src/data/prospects.js`
  - Watchlist, compare queue, compare matrix, and local notes
  - Updated styling in `src/index.css`
- Backup:
  - Local zip: `C:\Users\danud\Desktop\prospera-checkpoint-20260402-082535.zip`

## How To Create The Next Checkpoint

1. Commit and push the current work.
2. Create a git tag with a timestamped name.
3. Push the tag to GitHub.
4. Export a zip snapshot locally if you want a file backup too.
5. Add a new section to this file with:
   - date
   - tag
   - commit
   - what changed
   - backup zip path if one exists
