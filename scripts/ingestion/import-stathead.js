#!/usr/bin/env node
// Read the Stathead CSV exports under imports/upstream/stathead/ and join the
// rows by player name onto every per-year historical file. Adds cbbStats
// (college career totals + advanced metrics) and srNbaStats (NBA WS, AS,
// shooting splits) when a match is found. Idempotent.
//
// Sports Reference attribution required when using this data.

const fs = require('fs');
const path = require('path');

const STATHEAD_DIR = path.join(__dirname, '..', '..', 'imports', 'upstream', 'stathead');
const HIST_DIR = path.join(__dirname, '..', '..', 'imports', 'upstream', 'historical');

const CBB_PATH = path.join(STATHEAD_DIR, 'stathead-cbb-seasons.csv');
const NBA_PATH = path.join(STATHEAD_DIR, 'stathead-nba-early-career.csv');

// ---------- CSV PARSER (handles SR header lines + quoted fields) ----------
function parseCsv(text) {
  const lines = text.split(/\r?\n/);
  // Skip header lines: drop until we find one that has commas + a known column like "Player"
  let headerIdx = lines.findIndex((line) => /(^|,)Player/i.test(line) && line.split(',').length > 5);
  if (headerIdx < 0) return { headers: [], rows: [] };
  const rawHeaders = parseLine(lines[headerIdx]);
  const headers = rawHeaders.map((h) => h.replace(/▲|▼/g, '').trim());
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const fields = parseLine(line);
    if (fields.length < 2) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = fields[j];
    rows.push(obj);
  }
  return { headers, rows };
}

function parseLine(line) {
  const out = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

// ---------- NAME NORMALIZATION ----------
function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\bjr\b|\bsr\b|\bii\b|\biii\b|\biv\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toNumber(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toPercent(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  // SR uses ".584" form (decimal); normalize to percentage 0-100
  return Math.round(n * 1000) / 10;
}

// ---------- ROW EXTRACTORS ----------
function buildCbbRow(row) {
  const games = toNumber(row.G) || 0;
  const points = toNumber(row.PTS) || 0;
  const reb = toNumber(row.TRB);
  const ast = toNumber(row.AST);
  const min = toNumber(row.MP);
  return {
    fromSeason: row.From,
    toSeason: row.To,
    games,
    minutes: min,
    pointsTotal: points,
    pointsPerGame: games > 0 ? Math.round((points / games) * 10) / 10 : null,
    reboundsPerGame: games > 0 && reb != null ? Math.round((reb / games) * 10) / 10 : null,
    assistsPerGame: games > 0 && ast != null ? Math.round((ast / games) * 10) / 10 : null,
    fgPct: toPercent(row['FG%']),
    threePct: toPercent(row['3P%']),
    ftPct: toPercent(row['FT%']),
    tsPct: toPercent(row['TS%']),
    bpm: toNumber(row.BPM),
    gameScore: toNumber(row.GmSc),
    srSlug: row['Player-additional'] || null,
    source: 'sports-reference / stathead',
  };
}

function buildNbaRow(row) {
  const games = toNumber(row.G) || 0;
  const ws = toNumber(row.WS);
  const allStar = toNumber(row.AS) || 0;
  const ageRange = row.Age || '';
  return {
    fromSeason: row.From,
    toSeason: row.To,
    ageRange,
    games,
    minutes: toNumber(row.MP),
    pointsTotal: toNumber(row.PTS),
    winShares: ws,
    allStarSelections: allStar,
    pointsPerGame: games > 0 && row.PTS != null ? Math.round((Number(row.PTS) / games) * 10) / 10 : null,
    reboundsPerGame: games > 0 && row.TRB != null ? Math.round((Number(row.TRB) / games) * 10) / 10 : null,
    assistsPerGame: games > 0 && row.AST != null ? Math.round((Number(row.AST) / games) * 10) / 10 : null,
    fgPct: toPercent(row['FG%']),
    threePct: toPercent(row['3P%']),
    ftPct: toPercent(row['FT%']),
    tsPct: toPercent(row['TS%']),
    efgPct: toPercent(row['eFG%']),
    pos: row.Pos || '',
    teams: row.Team || '',
    srSlug: row['Player-additional'] || null,
    source: 'sports-reference / stathead',
  };
}

// ---------- DRIVER ----------
function loadCsv(file, builder) {
  if (!fs.existsSync(file)) {
    console.log(`SKIP ${path.basename(file)} (not found)`);
    return new Map();
  }
  const { rows } = parseCsv(fs.readFileSync(file, 'utf8'));
  const map = new Map();
  for (const row of rows) {
    const key = normalizeName(row.Player);
    if (!key) continue;
    map.set(key, builder(row));
  }
  console.log(`Loaded ${rows.length} rows from ${path.basename(file)}`);
  return map;
}

function processYear(year, cbbMap, nbaMap) {
  const target = path.join(HIST_DIR, `${year}.json`);
  if (!fs.existsSync(target)) return { hits: 0, total: 0 };
  const records = JSON.parse(fs.readFileSync(target, 'utf8'));
  let hits = 0;
  for (const record of records) {
    const key = normalizeName(record.name);
    const cbb = cbbMap.get(key);
    const nba = nbaMap.get(key);
    if (cbb) record.cbbStats = cbb;
    if (nba) record.srNbaStats = nba;
    if (cbb || nba) hits++;
  }
  fs.writeFileSync(target, `${JSON.stringify(records, null, 2)}\n`);
  return { hits, total: records.length };
}

function main() {
  const cbbMap = loadCsv(CBB_PATH, buildCbbRow);
  const nbaMap = loadCsv(NBA_PATH, buildNbaRow);
  let totalHits = 0;
  let totalRecords = 0;
  for (let year = 2000; year <= 2025; year++) {
    const { hits, total } = processYear(year, cbbMap, nbaMap);
    if (total > 0) console.log(`YEAR ${year}: matched ${hits}/${total}`);
    totalHits += hits;
    totalRecords += total;
  }
  console.log(`\nTotal matches: ${totalHits} of ${totalRecords} historical records.`);
}

if (require.main === module) main();
module.exports = { parseCsv, normalizeName };
