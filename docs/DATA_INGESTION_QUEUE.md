# Data Ingestion Queue

Pending data pulls that will sharpen the comp engine + prospect profiles.
Each entry is a self-contained checklist — the next person (or AI) picking
this up can execute without needing the surrounding context.

---

## QUEUED · Status: ready to pull

### 1. Stathead CBB "Per Game" / "Totals" pull · primitives for shooting rates

**Why this matters:** The current bulk Stathead Advanced export filters out
pre-2011 players because TS% / eFG% / 3PAr aren't pre-computed for older
seasons. But the underlying inputs (FGA, 3PA, FTA, PTS) **are tracked back
to 1986-87** in the Per Game / Totals panels. Pulling the inputs lets us
compute the rates locally for **all eras** — closing the pre-2011 gap from
~36% coverage to ~95%.

Also computes Free Throw Rate (FTr = FTA / FGA) and Foul Rate per 100 (PFr)
which we don't have for any historicals or current prospects yet.

**Two exports needed:**

#### A. Historical pool

- **Stathead query:** Player Career Finder · "Per Game" or "Totals" panel
- **Filter:** Draft Year 2000-2026 (all years)
- **Columns required:** `Player`, `FGA`, `3P`, `3PA`, `FTA`, `FT`, `PTS`, `PF`, `MP`, `G`, `Draft Year`, `From`, `To`, `Player-additional`
- **Save as:** `imports/upstream/stathead/stathead-cbb-totals-historicals.csv`
- **Pagination:** likely needs multiple pages — go to the end. Should yield ~1,200 rows (parity with the existing cbb-advanced-careers file).

#### B. 2026 active class (current season)

- **Stathead query:** Player Season Finder · "Per Game" panel
- **Filter:** 2025-26 season, NCAA Division I, only the 59 active prospects (from `src/data/prospectAliases.json`). If filtering by name list is awkward, just pull all D1 players who logged minutes; the ingestion script will match against the alias dictionary.
- **Columns required:** Same as above (`FGA`, `3P`, `3PA`, `FTA`, `FT`, `PTS`, `PF`, `MP`, `G`, `Player`)
- **Save as:** `imports/upstream/stathead/stathead-cbb-totals-2026-prospects.csv`

**What I'll do once both files land:**

1. Extend `scripts/ingestion/enrich-historical-advanced.js` to read both files
2. Compute and merge into `cbbAdv` for historicals:
   - `tsPct = PTS / (2 * (FGA + 0.44 × FTA)) × 100`
   - `efgPct = (FGM + 0.5 × 3PM) / FGA × 100`
   - `threePAr = 3PA / FGA × 100`
   - `ftr = FTA / FGA × 100`
   - `pfr = PF / (MP * pace_proxy) × 100`  (foul rate per 100 possessions, approximated)
3. Same pipeline for 2026 prospects → write into `profileStats.json` overlay
4. Add new features to comp engine feature vector: TS%, 3PAr, FTr (+1.5 weight each)
5. Surface FTr and 3PAr on the player profile / historical card

**Estimated coverage gain:**
- Historicals with TS%/3PAr/eFG%: 36% → ~95%
- 2026 prospects with 3PAr: 0% → 100%
- New: FTr + PFr coverage on both populations

---

### 2. Hoop-Math shot location splits · 2026 prospects

**Why this matters:** Shot diet is the single strongest predictor of NBA
shooting translation. A 6'7 wing taking 25% of his shots from 3 in college
projects very differently than one taking 5%, even at the same TS%. Hoop-Math
has the rim / midrange / 3PT splits broken out by player.

**Source:** `hoop-math.com` — D1 player shot distribution

**What to pull:**
- For each of the 59 active 2026 prospects, the season-level shot location splits:
  - `% at rim` (FGA at rim / total FGA)
  - `% midrange` (2PT outside rim)
  - `% from 3` (3PT FGA / total FGA)
  - `eFG at rim` / `eFG midrange` / `eFG 3PT` (efficiency by zone)
  - `Assisted% at rim` (helps differentiate self-creation finishers from cuts/dunkers)

**Workflow:**
- Hoop-Math's team pages list each player's splits — one team page per school in the active class. Capture a screenshot or copy the table.
- Export format: a single CSV per the active class works fine. Name → splits.
- **Save as:** `imports/upstream/hoop-math/2026-shot-locations.csv`

**What I'll do once it lands:**
- New ingestion script (`scripts/ingestion/import-hoop-math.js`)
- Write into `profileStats.json` overlay as `stats.shotProfile`
- New "Shot Diet" panel on the player profile Stats tab (rim / mid / 3 distribution + zone efficiency)
- Optionally add shot diet features to the comp engine (would need historical equivalents to be useful — see future deferred section)

**Note on historical coverage:** Hoop-Math archives go back to 2012-13. Pre-
2012 historicals would still lack shot diet. Acceptable for now since the
modern comp pool is what matters for matching current prospects.

---

## DEFERRED · waiting on subscriptions

### 3. KenPom · Strength of Schedule + Adjusted Ratings

**Cost:** ~$25/year (academic) or $24.95/year (standard)
**URL:** `kenpom.com`
**Era covered:** 2002-present

**Why useful:**
- **Strength of Schedule (SOS)** — fairly ranks mid-major prospects against high-major. Without it, a guy putting up 25/8/5 in the SoCon looks identical to one in the Big 12.
- **Adjusted ORtg / DRtg** — pace + opponent-adjusted versions of the unadjusted ratings we already have.
- **Year-by-year season data** — we'd get richer single-season splits for historicals.

**What to pull when subscribed:**
- Player ratings table (kenpom.com → "Player Stats" or season summary export)
- Columns: `Player`, `Team`, `AdjORtg`, `AdjDRtg`, `Usage%`, `eFG%`, `TO%`, `OR%`, `FTRate`, `2P%`, `3P%`, `FT%`, `Assist%`, `Block%`, `Steal%`, `Foul%`
- Plus team-level SOS so each player can be tagged with their schedule strength
- One pull per season (2002-2026) — 24 seasons total

**What I'd do:** New `scripts/ingestion/import-kenpom.js` that joins on player slug. Adjusted metrics become primary; unadjusted SR metrics become fallback. SOS becomes a feature in the comp engine and a label on cards ("vs A+ schedule").

---

### 4. Synergy Sports · Play-type breakdowns + defensive impact

**Cost:** Pro tier ~$2,500-$10,000/year (team subscription); some data on Synergy Edit/Player Edit ($)
**URL:** `synergysports.com`
**Era covered:** 2007-present (limited modern era)

**Why useful:**
- **Play-type breakdowns** — pick-and-roll volume, isolation, spot-up, post-up, transition splits
- **Catch-and-shoot vs pull-up** — different translation curves
- **Defensive impact metrics** — actual FG% allowed when defending, contest rates, deflections
- **Tracking data not available anywhere else** — drives, post touches, contested 3s

**What to pull when subscribed:**
- Per-prospect play-type breakdown CSV
- Defensive metrics (FG% allowed, points allowed per possession by play type)

**What I'd do:** Big project. Rebuild the "Advantage" tab with play-type-resolved data. Replace the heuristic-derived advantage profile with actual Synergy splits. Wire defensive impact into comp engine (replaces our DRtg-only defensive feature). Probably 2-3 days of work depending on data shape.

---

### 5. Pre-2011 historical shooting data · refinement of manual overrides

**Status:** 26 manual overrides currently in `src/data/cbbShootingManualOverrides.json` are best-effort estimates. If after pulling Item 1 above we still find gaps for specific high-end stars (or want to tighten the values), the SR per-page numbers can be looked up manually.

**Procedure:** Open `sports-reference.com/cbb/players/{slug}-1.html` for each missing star, read the "Career" totals row, edit the JSON. ~30 sec per player.

---

## Update log

- **2026-05-06:** Document created. Items 1+2 user-confirmed; 3+4 deferred pending subscription.
