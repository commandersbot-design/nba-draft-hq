#!/usr/bin/env node
// Pull season-by-season stats from stats.nba.com (the same playercareerstats
// endpoint we already use, just reading the season-level result set instead
// of the career totals row). For each player, store a `peakSeason` summary
// and a `peak3` rolling average (best 3-season impact stretch).
//
// This is the "peak detection" upgrade: classifiers based on career averages
// underrate players whose best years were short-lived (early bust-outs,
// injuries, role changes). Peak windows are closer to scout intuition.

const fs = require('fs');
const path = require('path');

const HIST_DIR = path.join(__dirname, '..', '..', 'imports', 'upstream', 'historical');
const ENDPOINT = 'https://stats.nba.com/stats/playercareerstats';
const DELAY_MS = 700;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://www.nba.com',
  'Referer': 'https://www.nba.com/',
  'x-nba-stats-token': 'true',
  'x-nba-stats-origin': 'stats',
};

function indexHeaders(headers) {
  const map = {};
  headers.forEach((name, idx) => { map[name] = idx; });
  return map;
}

function rowAsObject(headers, row) {
  const idx = indexHeaders(headers);
  const out = {};
  for (const key of Object.keys(idx)) out[key] = row[idx[key]];
  return out;
}

async function fetchJson(url, attempt = 0) {
  const response = await fetch(url, { headers: HEADERS });
  if (response.status === 429 && attempt < 3) {
    await sleep(5000 * (attempt + 1));
    return fetchJson(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function fetchSeasons(personId) {
  const url = `${ENDPOINT}?PlayerID=${personId}&PerMode=PerGame&LeagueID=00`;
  const payload = await fetchJson(url);
  const set = payload.resultSets?.find((s) => s.name === 'SeasonTotalsRegularSeason');
  if (!set) return [];
  return set.rowSet.map((row) => rowAsObject(set.headers, row));
}

function impactScore(season) {
  const ppg = Number(season.PTS) || 0;
  const rpg = Number(season.REB) || 0;
  const apg = Number(season.AST) || 0;
  const games = Number(season.GP) || 0;
  if (games < 20) return 0;
  return ppg + rpg * 0.7 + apg * 1.2;
}

function peakSeasonOf(seasons) {
  const filtered = (seasons || []).filter((s) => Number(s.GP) >= 20);
  if (filtered.length === 0) return null;
  return filtered.reduce((best, s) => (impactScore(s) > impactScore(best) ? s : best), filtered[0]);
}

function peak3Of(seasons) {
  const usable = (seasons || []).filter((s) => Number(s.GP) >= 20);
  if (usable.length < 1) return null;
  // Find the best 3-consecutive-season stretch by average impact
  if (usable.length < 3) {
    const avg = usable.reduce((acc, s) => acc + impactScore(s), 0) / usable.length;
    return summarizeSeasons(usable, avg);
  }
  let bestAvg = -Infinity;
  let bestSlice = null;
  for (let i = 0; i + 3 <= usable.length; i++) {
    const slice = usable.slice(i, i + 3);
    const avg = slice.reduce((acc, s) => acc + impactScore(s), 0) / 3;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestSlice = slice;
    }
  }
  return summarizeSeasons(bestSlice || [], bestAvg);
}

function summarizeSeasons(slice, avgImpact) {
  if (slice.length === 0) return null;
  const sum = (key) => slice.reduce((acc, s) => acc + (Number(s[key]) || 0), 0);
  const avg = (key) => Math.round((sum(key) / slice.length) * 10) / 10;
  return {
    seasons: slice.map((s) => s.SEASON_ID),
    avgImpact: Math.round(avgImpact * 10) / 10,
    pointsPerGame: avg('PTS'),
    reboundsPerGame: avg('REB'),
    assistsPerGame: avg('AST'),
    stealsPerGame: avg('STL'),
    blocksPerGame: avg('BLK'),
    fgPct: avg('FG_PCT'),
    threePct: avg('FG3_PCT'),
    games: sum('GP'),
  };
}

function summarizePeak(season) {
  if (!season) return null;
  return {
    season: season.SEASON_ID,
    age: Number(season.PLAYER_AGE) || null,
    team: season.TEAM_ABBREVIATION,
    games: Number(season.GP) || 0,
    pointsPerGame: Number(season.PTS) || 0,
    reboundsPerGame: Number(season.REB) || 0,
    assistsPerGame: Number(season.AST) || 0,
    stealsPerGame: Number(season.STL) || 0,
    blocksPerGame: Number(season.BLK) || 0,
    impactScore: Math.round(impactScore(season) * 10) / 10,
  };
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function parseArgs(argv) {
  const args = { from: 2000, to: 2025, force: false };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--from') args.from = Number(argv[++i]);
    else if (v === '--to') args.to = Number(argv[++i]);
    else if (v === '--force') args.force = true;
  }
  return args;
}

async function processYear(year, args) {
  const target = path.join(HIST_DIR, `${year}.json`);
  if (!fs.existsSync(target)) return { processed: 0, hits: 0 };
  const records = JSON.parse(fs.readFileSync(target, 'utf8'));
  let processed = 0;
  let hits = 0;
  for (const record of records) {
    if (record.peakSeason && !args.force) continue;
    const personId = record.nbaStats?.personId;
    if (!personId) continue;
    processed++;
    try {
      const seasons = await fetchSeasons(personId);
      const peak = summarizePeak(peakSeasonOf(seasons));
      const peak3 = peak3Of(seasons);
      record.peakSeason = peak;
      record.peak3 = peak3;
      record.seasonsCount = seasons.filter((s) => Number(s.GP) >= 20).length;
      if (peak) hits++;
    } catch (e) {
      console.log(`  ! ${record.name}: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }
  fs.writeFileSync(target, `${JSON.stringify(records, null, 2)}\n`);
  console.log(`YEAR ${year}: peak detected for ${hits}/${processed} (of ${records.length} records)`);
  return { processed, hits };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Detecting peak seasons for ${args.from}-${args.to}${args.force ? ' (force)' : ''}`);
  let totalProcessed = 0;
  let totalHits = 0;
  for (let year = args.from; year <= args.to; year++) {
    const { processed, hits } = await processYear(year, args);
    totalProcessed += processed;
    totalHits += hits;
  }
  console.log(`\nDone. Peak seasons detected for ${totalHits}/${totalProcessed} processed records.`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
