# Historical Source Drop-In Workflow

Prospera now supports bulk historical source drops per provider directory.

## Source directories

- `imports/upstream/collegebasketballdata/`
- `imports/upstream/sports-reference/`
- `imports/upstream/bart-torvik/`
- `imports/upstream/basketball-reference/`
- `imports/upstream/nba-combine/`

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
