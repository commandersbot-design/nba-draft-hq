#!/usr/bin/env node
// Loop the existing per-year historical files and backfill missing
// position/height/age/career-stats using stats.nba.com commonplayerinfo and
// playercareerstats. Polite delay between requests; resumable (skips records
// that already have position+height+age unless --force is set).

const fs = require('fs');
const path = require('path');

const HIST_DIR = path.join(__dirname, '..', '..', 'imports', 'upstream', 'historical');
const COMMON_INFO = 'https://stats.nba.com/stats/commonplayerinfo';
const CAREER_STATS = 'https://stats.nba.com/stats/playercareerstats';
const DELAY_MS = 800;

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
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

async function fetchCommonInfo(personId) {
  const url = `${COMMON_INFO}?PlayerID=${personId}&LeagueID=00`;
  const payload = await fetchJson(url);
  const set = payload.resultSets?.find((s) => s.name === 'CommonPlayerInfo');
  if (!set || set.rowSet.length === 0) return null;
  return rowAsObject(set.headers, set.rowSet[0]);
}

async function fetchCareerStats(personId) {
  const url = `${CAREER_STATS}?PlayerID=${personId}&PerMode=PerGame&LeagueID=00`;
  const payload = await fetchJson(url);
  const set = payload.resultSets?.find((s) => s.name === 'CareerTotalsRegularSeason');
  if (!set || set.rowSet.length === 0) return null;
  return rowAsObject(set.headers, set.rowSet[0]);
}

function ageFromBirthdate(birthdate, draftYear) {
  if (!birthdate || !draftYear) return null;
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return null;
  const draftDate = new Date(`${draftYear}-06-25`);
  const ageMs = draftDate.getTime() - dob.getTime();
  if (ageMs <= 0) return null;
  return Number((ageMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));
}

function heightString(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim().replace('"', '').replace("'", '-');
  return trimmed || '';
}

function trueShootingPct(stats) {
  if (!stats) return '';
  const pts = stats.PTS || 0;
  const fga = stats.FGA || 0;
  const fta = stats.FTA || 0;
  const denominator = 2 * (fga + 0.44 * fta);
  if (denominator <= 0) return '';
  const rate = pts / denominator;
  return `${(rate * 100).toFixed(1)}%`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const args = { from: 2000, to: 2019, force: false, limit: null };
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i];
    if (value === '--from') args.from = Number(argv[++i]);
    else if (value === '--to') args.to = Number(argv[++i]);
    else if (value === '--force') args.force = true;
    else if (value === '--limit') args.limit = Number(argv[++i]);
  }
  return args;
}

function needsEnrichment(prospect, force) {
  if (force) return true;
  return !prospect.position || !prospect.height || prospect.age == null || prospect.pointsPerGame == null;
}

async function enrichProspect(prospect) {
  const personId = prospect.nbaStats?.personId;
  if (!personId) return false;

  const info = await fetchCommonInfo(personId);
  await sleep(DELAY_MS);
  const career = await fetchCareerStats(personId);

  if (info) {
    prospect.position = prospect.position || info.POSITION || '';
    prospect.height = prospect.height || heightString(info.HEIGHT);
    if (prospect.age == null && info.BIRTHDATE) {
      prospect.age = ageFromBirthdate(info.BIRTHDATE, prospect.draftYear);
    }
    prospect.nbaStats = {
      ...(prospect.nbaStats || {}),
      country: info.COUNTRY,
      weight: info.WEIGHT,
      birthdate: info.BIRTHDATE,
      draftedTeam: info.TEAM_NAME,
      seasonsActive: info.SEASON_EXP,
    };
  }

  if (career) {
    prospect.pointsPerGame = prospect.pointsPerGame ?? (career.PTS != null ? Number(career.PTS) : null);
    prospect.reboundsPerGame = prospect.reboundsPerGame ?? (career.REB != null ? Number(career.REB) : null);
    prospect.assistsPerGame = prospect.assistsPerGame ?? (career.AST != null ? Number(career.AST) : null);
    if (!prospect.trueShooting) prospect.trueShooting = trueShootingPct(career);
    prospect.nbaStats = {
      ...(prospect.nbaStats || {}),
      careerGames: career.GP,
      careerMinutes: career.MIN,
      careerPpg: career.PTS,
      careerRpg: career.REB,
      careerApg: career.AST,
      careerSpg: career.STL,
      careerBpg: career.BLK,
    };
  }

  return Boolean(info || career);
}

async function processYear(year, args) {
  const target = path.join(HIST_DIR, `${year}.json`);
  if (!fs.existsSync(target)) {
    console.log(`SKIP ${year} — no upstream file`);
    return { processed: 0, enriched: 0 };
  }
  const prospects = JSON.parse(fs.readFileSync(target, 'utf8'));
  let processed = 0;
  let enriched = 0;
  let limit = args.limit;
  for (const prospect of prospects) {
    if (limit != null && limit <= 0) break;
    if (!needsEnrichment(prospect, args.force)) continue;
    processed++;
    try {
      const ok = await enrichProspect(prospect);
      if (ok) enriched++;
    } catch (error) {
      console.log(`  ! ${prospect.name} (${prospect.id}): ${error.message}`);
    }
    if (limit != null) limit--;
    await sleep(DELAY_MS);
  }
  fs.writeFileSync(target, `${JSON.stringify(prospects, null, 2)}\n`);
  console.log(`YEAR ${year}: enriched ${enriched}/${processed} of ${prospects.length}`);
  return { processed, enriched };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Enriching ${args.from}-${args.to}${args.force ? ' (force)' : ''}${args.limit ? ` limit=${args.limit}` : ''}`);
  let totalProcessed = 0;
  let totalEnriched = 0;
  for (let year = args.from; year <= args.to; year++) {
    const { processed, enriched } = await processYear(year, args);
    totalProcessed += processed;
    totalEnriched += enriched;
  }
  console.log(`\nDone. Enriched ${totalEnriched}/${totalProcessed} total.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { enrichProspect, processYear };
