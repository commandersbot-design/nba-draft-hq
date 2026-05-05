#!/usr/bin/env node
// Read the two career-advanced Sports Reference CSVs (NBA + CBB) and build a
// sidecar `src/data/historicalAdvancedStats.json` keyed by the existing
// historical prospect id (name-slug + year).
//
// Source CSVs live in `imports/upstream/stathead/`:
//   - stathead-nba-advanced-careers.csv  (BPM, VORP, PER, USG%, TS%, AST%,...)
//   - stathead-cbb-advanced-careers.csv  (college BPM, PER, rate stats, ORtg)
//
// Output: src/data/historicalAdvancedStats.json
//   { "<historical-id>": { nbaAdv: {...}, cbbAdv: {...}, source: "sr" } }
//
// The frontend merges this into each historical prospect at render time so
// nothing about the existing SQLite pipeline has to change.

const fs = require('fs');
const path = require('path');

const STATHEAD_DIR = path.join(__dirname, '..', '..', 'imports', 'upstream', 'stathead');
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'historicalAdvancedStats.json');
const HIST_PROSPECTS_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'historicalProspects.json');

const NBA_FILE = path.join(STATHEAD_DIR, 'stathead-nba-advanced-careers.csv');
const CBB_FILE = path.join(STATHEAD_DIR, 'stathead-cbb-advanced-careers.csv');

// ---------- CSV PARSER ----------
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

function parseCsv(text) {
  const lines = text.split(/\r?\n/);
  const headerIdx = lines.findIndex((line) => /(^|,)Player/i.test(line) && line.split(',').length > 5);
  if (headerIdx < 0) return { headers: [], rows: [] };
  const headers = parseLine(lines[headerIdx]).map((h) => h.replace(/▲|▼/g, '').trim());
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

// ---------- HELPERS ----------
function toNum(v) {
  if (v == null || v === '' || v === '-') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toPct(v) {
  if (v == null || v === '' || v === '-') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  // SR uses ".584" → percentage; rate stats already come as e.g. "23.4"
  return n;
}

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

// Build map keyed by `${normalizedName}|${draftYear}` → row.
// SR slug also captured for reference but name+year is the join key
// (matches the historical prospect id format).
function buildKeyedMap(rows) {
  const map = new Map();
  for (const row of rows) {
    const name = row.Player;
    const year = toNum(row['Draft Year']);
    if (!name || !year) continue;
    const key = `${normalizeName(name)}|${year}`;
    map.set(key, row);
  }
  return map;
}

// ---------- ROW EXTRACTORS ----------
function extractNbaAdvanced(row) {
  return {
    g: toNum(row.G),
    gs: toNum(row.GS),
    minutes: toNum(row.MP),
    ws: toNum(row.WS),
    ws48: toNum(row['WS/48']),
    ows: toNum(row.OWS),
    dws: toNum(row.DWS),
    bpm: toNum(row.BPM),
    obpm: toNum(row.OBPM),
    dbpm: toNum(row.DBPM),
    vorp: toNum(row.VORP),
    per: toNum(row.PER),
    ortg: toNum(row.ORtg),
    drtg: toNum(row.DRtg),
    usgPct: toPct(row['USG%']),
    astPct: toPct(row['AST%']),
    stlPct: toPct(row['STL%']),
    blkPct: toPct(row['BLK%']),
    trbPct: toPct(row['TRB%']),
    orbPct: toPct(row['ORB%']),
    drbPct: toPct(row['DRB%']),
    tovPct: toPct(row['TOV%']),
    allStarSelections: toNum(row.AS),
    pos: row.Pos || '',
    teams: row.Team || '',
    fromSeason: row.From,
    toSeason: row.To,
    srSlug: row['Player-additional'] || null,
  };
}

function extractCbbAdvanced(row) {
  return {
    g: toNum(row.G),
    gs: toNum(row.GS),
    pts: toNum(row.PTS),
    ws: toNum(row.WS),
    ws40: toNum(row['WS/40']),
    ows: toNum(row.OWS),
    dws: toNum(row.DWS),
    bpm: toNum(row.BPM),
    obpm: toNum(row.OBPM),
    dbpm: toNum(row.DBPM),
    per: toNum(row.PER),
    ortg: toNum(row.ORtg),
    drtg: toNum(row.DRtg),
    usgPct: toPct(row['USG%']),
    astPct: toPct(row['AST%']),
    stlPct: toPct(row['STL%']),
    blkPct: toPct(row['BLK%']),
    trbPct: toPct(row['TRB%']),
    orbPct: toPct(row['ORB%']),
    drbPct: toPct(row['DRB%']),
    tovPct: toPct(row['TOV%']),
    pos: row.Pos || '',
    team: row.Team || '',
    fromSeason: row.From,
    toSeason: row.To,
    srSlug: row['Player-additional'] || null,
  };
}

// ---------- DRIVER ----------
function main() {
  if (!fs.existsSync(NBA_FILE)) {
    console.error(`Missing ${NBA_FILE}`);
    process.exit(1);
  }
  if (!fs.existsSync(CBB_FILE)) {
    console.error(`Missing ${CBB_FILE}`);
    process.exit(1);
  }
  if (!fs.existsSync(HIST_PROSPECTS_PATH)) {
    console.error(`Missing ${HIST_PROSPECTS_PATH} — run sync-historical-prospects first.`);
    process.exit(1);
  }

  const { rows: nbaRows } = parseCsv(fs.readFileSync(NBA_FILE, 'utf8'));
  const { rows: cbbRows } = parseCsv(fs.readFileSync(CBB_FILE, 'utf8'));
  console.log(`Loaded ${nbaRows.length} NBA advanced rows, ${cbbRows.length} CBB advanced rows.`);

  const nbaByKey = buildKeyedMap(nbaRows);
  const cbbByKey = buildKeyedMap(cbbRows);

  const historicalProspects = JSON.parse(fs.readFileSync(HIST_PROSPECTS_PATH, 'utf8'));
  const sidecar = {};
  let nbaHits = 0;
  let cbbHits = 0;
  let bothHits = 0;
  const missingNba = [];
  const missingCbb = [];

  for (const p of historicalProspects) {
    const key = `${normalizeName(p.name)}|${p.draftYear}`;
    const nbaRow = nbaByKey.get(key);
    const cbbRow = cbbByKey.get(key);
    if (!nbaRow && !cbbRow) {
      missingNba.push(p.name);
      missingCbb.push(p.name);
      continue;
    }
    const entry = { source: 'sports-reference / stathead' };
    if (nbaRow) {
      entry.nbaAdv = extractNbaAdvanced(nbaRow);
      nbaHits++;
    } else {
      missingNba.push(p.name);
    }
    if (cbbRow) {
      entry.cbbAdv = extractCbbAdvanced(cbbRow);
      cbbHits++;
    } else {
      missingCbb.push(p.name);
    }
    if (nbaRow && cbbRow) bothHits++;
    sidecar[p.id] = entry;
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(sidecar, null, 2)}\n`);

  console.log('');
  console.log('========== COVERAGE ==========');
  console.log(`Historical prospects total: ${historicalProspects.length}`);
  console.log(`NBA advanced matched:       ${nbaHits} (${((nbaHits / historicalProspects.length) * 100).toFixed(1)}%)`);
  console.log(`CBB advanced matched:       ${cbbHits} (${((cbbHits / historicalProspects.length) * 100).toFixed(1)}%)`);
  console.log(`Both NBA + CBB matched:     ${bothHits} (${((bothHits / historicalProspects.length) * 100).toFixed(1)}%)`);
  console.log('==============================');
  console.log('');
  console.log(`Wrote ${Object.keys(sidecar).length} entries to ${OUTPUT_PATH}`);

  if (missingNba.length > 0 && missingNba.length <= 30) {
    console.log('');
    console.log(`Sample of unmatched (NBA): ${missingNba.slice(0, 15).join(', ')}`);
  }
}

if (require.main === module) main();
module.exports = { extractNbaAdvanced, extractCbbAdvanced, parseCsv, normalizeName };
