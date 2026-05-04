#!/usr/bin/env node
// Fetch NBA draft history (one year at a time) from stats.nba.com and write
// per-year JSON files in the schema the historical pipeline already expects.
// Hand-authored fixtures (2020-2024) are not overwritten by default.

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'imports', 'upstream', 'historical');
const ENDPOINT = 'https://stats.nba.com/stats/drafthistory';
const DEFAULT_FROM = 2000;
const DEFAULT_TO = 2019;
const DELAY_MS = 2000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://www.nba.com',
  'Referer': 'https://www.nba.com/',
  'x-nba-stats-token': 'true',
  'x-nba-stats-origin': 'stats',
};

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function indexHeaders(headers) {
  const map = {};
  headers.forEach((name, idx) => { map[name] = idx; });
  return map;
}

function rowToProspect(row, idx, year) {
  const get = (key) => (idx[key] != null ? row[idx[key]] : null);
  const name = get('PLAYER_NAME');
  const overallPick = get('OVERALL_PICK');
  const organization = get('ORGANIZATION');
  if (!name || overallPick == null) return null;
  const id = `${slugify(name)}-${year}`;
  return {
    id,
    name,
    draftYear: year,
    draftSlot: Number(overallPick) || 999,
    position: '',
    school: organization || '',
    height: '',
    age: null,
    archetype: '',
    roleOutcome: '',
    outcomeTier: '',
    pointsPerGame: null,
    reboundsPerGame: null,
    assistsPerGame: null,
    trueShooting: '',
    bpm: null,
    notes: '',
    nbaStats: {
      personId: get('PERSON_ID'),
      round: Number(get('ROUND_NUMBER')) || null,
      roundPick: Number(get('ROUND_PICK')) || null,
      teamAbbreviation: get('TEAM_ABBREVIATION'),
      teamCity: get('TEAM_CITY'),
      teamName: get('TEAM_NAME'),
      organization: organization,
      organizationType: get('ORGANIZATION_TYPE'),
    },
  };
}

async function fetchYear(year) {
  const params = new URLSearchParams({
    College: '',
    LeagueID: '00',
    OverallPick: '',
    RoundNum: '',
    RoundPick: '',
    Season: String(year),
    TeamID: '0',
    TopX: '',
  });
  const url = `${ENDPOINT}?${params.toString()}`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`NBA Stats responded ${response.status} ${response.statusText} for ${year}`);
  }
  const payload = await response.json();
  const resultSet = payload.resultSets?.find((s) => s.name === 'DraftHistory') || payload.resultSets?.[0];
  if (!resultSet) throw new Error(`No DraftHistory result set for ${year}`);
  const idx = indexHeaders(resultSet.headers);
  return resultSet.rowSet
    .map((row) => rowToProspect(row, idx, year))
    .filter(Boolean);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const args = { from: DEFAULT_FROM, to: DEFAULT_TO, force: false };
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i];
    if (value === '--from') args.from = Number(argv[++i]);
    else if (value === '--to') args.to = Number(argv[++i]);
    else if (value === '--force') args.force = true;
  }
  return args;
}

async function main() {
  const { from, to, force } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const years = [];
  for (let y = from; y <= to; y++) years.push(y);

  let totalRows = 0;
  let written = 0;
  let skipped = 0;

  for (const year of years) {
    const target = path.join(OUTPUT_DIR, `${year}.json`);
    if (fs.existsSync(target) && !force) {
      console.log(`SKIP ${year} — ${path.relative(process.cwd(), target)} exists (use --force to overwrite)`);
      skipped++;
      continue;
    }
    process.stdout.write(`FETCH ${year}…`);
    try {
      const prospects = await fetchYear(year);
      fs.writeFileSync(target, `${JSON.stringify(prospects, null, 2)}\n`);
      console.log(` ${prospects.length} picks → ${path.relative(process.cwd(), target)}`);
      totalRows += prospects.length;
      written++;
    } catch (error) {
      console.log(` FAILED: ${error.message}`);
    }
    if (year !== years[years.length - 1]) await sleep(DELAY_MS);
  }

  console.log(`\nWrote ${written} year file(s), ${totalRows} draft picks. Skipped ${skipped} existing.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { fetchYear, rowToProspect };
