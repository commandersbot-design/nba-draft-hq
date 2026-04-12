# Historical Source Drop-In Workflow

Prospera now supports bulk historical source drops per provider directory.

## Source directories

- `imports/upstream/collegebasketballdata/`
- `imports/upstream/sports-reference/`
- `imports/upstream/bart-torvik/`
- `imports/upstream/basketball-reference/`
- `imports/upstream/nba-combine/`

Each directory can include a local `manifest.json` that documents expected field aliases and recommended file naming. The ingestion loader ignores manifest files automatically.

## Accepted file formats

- `.json`
- `.csv`
- `.jsonl`
- `.ndjson`

The shared loader recursively scans each source directory and unwraps common JSON shapes such as:

- `rows`
- `data`
- `results`
- `items`
- `records`
- `players`
- `prospects`
- `seasons`
- `games`
- `advancedMetrics`
- `draftHistory`
- `outcomes`
- `measurements`
- `combine`

## Safe file naming

Use year/class-oriented names such as:

- `2021.json`
- `2022-lottery.csv`
- `2023-combine.ndjson`
- `guards-2019-2021.jsonl`

Manifest, schema, and readme files are ignored by the loader.

## Recommended workflow

1. Drop raw class or year files into the correct source directory.
2. Check the local `manifest.json` in that folder if you need alias guidance.
3. Run:

```powershell
npm run ingest:historical:sources:status
```

4. Inspect `src/data/historicalSourceStatus.json` to confirm the row counts, detected years, and field coverage look sane.
5. Run the full pipeline:

```powershell
npm run ingest:historical:full
```

## Validation and status

Run:

```powershell
npm run ingest:historical:sources:status
```

This writes:

- `src/data/historicalSourceStatus.json`

The status export summarizes:

- source directories found
- file counts
- row counts
- detected years
- field coverage for name, season, team, position, and source player id

## Full pipeline

Run:

```powershell
npm run ingest:historical:full
```

That now performs:

1. bootstrap existing historical seed into source-specific upstream directories
2. sync raw source rows
3. normalize promoted rows
4. derive historical features
5. export derived frontend data
6. export coverage
7. export source status

## Practical rule

Drop raw historical files broadly, but trust only promoted normalized rows. The raw layer should be wide; the normalized and derived layers should stay selective.
