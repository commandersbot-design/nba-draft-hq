#!/usr/bin/env node
/**
 * import-bart-torvik.js
 *
 * Reads BartTorvik player-season CSV exports from
 *   imports/upstream/bart-torvik/{YEAR}.csv
 * and merges advanced stats (BPM, OBPM, DBPM, plus rate stats) into
 *   src/data/historicalAdvancedStats.json — specifically into the cbbAdv
 *   block of each matching historical prospect.
 *
 * Why this exists: Stathead/SR has CBB BPM only for seasons 2010-11+.
 * BartTorvik publishes the same Daniel Myers BPM going back further.
 * That closes the pre-2011 BPM gap for ~426 historicals in our pool.
 *
 * Tolerates BartTorvik column-name variations across years. Auto-detects
 * column indices from the CSV header.
 *
 * Usage:
 *   1. In a normal browser, go to https://barttorvik.com/playerstat.php?year=YYYY&t100=0
 *      (t100=0 means "show all players", not just top 100)
 *   2. Click CSV export, save as imports/upstream/bart-torvik/YYYY.csv
 *   3. Repeat for years 2003 through 2010
 *   4. Run: node scripts/ingestion/import-bart-torvik.js
 *
 * Idempotent — re-running won't double-fill. Existing values are preserved
 * (only fills nulls). Pass --force to overwrite.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const BT_DIR     = path.join(ROOT, 'imports', 'upstream', 'bart-torvik');
const HIST_PATH  = path.join(ROOT, 'src', 'data', 'historicalProspects.json');
const ADV_PATH   = path.join(ROOT, 'src', 'data', 'historicalAdvancedStats.json');

const FORCE = process.argv.includes('--force');

// ---------- CSV parsing ----------

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
  // Strip BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const lines = text.split(/\r?\n/);
  // Find header row — must have "Player" or "player" + multiple commas
  const headerIdx = lines.findIndex((l) => /\bPlayer\b|\bplayer\b/i.test(l) && l.split(',').length >= 5);
  if (headerIdx < 0) throw new Error('Could not find header row');
  const headers = parseLine(lines[headerIdx]).map((h) => h.trim());
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const fields = parseLine(lines[i]);
    if (fields.length < 5) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = fields[j];
    rows.push(obj);
  }
  return { headers, rows };
}

// ---------- Header → field mapping (tolerant) ----------

// Each entry: [outputKey, [list of acceptable header names case-insensitive]]
// First match wins. Header names lower-cased + whitespace-trimmed before compare.
const FIELD_MAP = [
  ['playerName', ['player', 'player_name', 'name']],
  ['team',       ['team', 'school', 'team_name']],
  ['conf',       ['conf', 'conference']],
  ['games',      ['g', 'games', 'gp']],
  ['minutes',    ['min', 'minutes', 'mp']],
  ['minPct',     ['min%', 'min_pct', 'mpct', 'minutes%']],

  ['bpm',        ['bpm']],
  ['obpm',       ['obpm', 'o_bpm']],
  ['dbpm',       ['dbpm', 'd_bpm']],
  ['ortg',       ['ortg', 'o_rtg', 'oratg']],
  ['drtg',       ['drtg', 'd_rtg', 'dratg']],
  ['per',        ['per']],

  ['usgPct',     ['usg%', 'usg_pct', 'usage', 'usage%']],
  ['astPct',     ['ast%', 'ast_pct', 'a%']],
  ['tovPct',     ['to%', 'tov%', 'tov_pct', 'turnover%']],
  ['stlPct',     ['stl%', 'stl_pct']],
  ['blkPct',     ['blk%', 'blk_pct']],
  ['orbPct',     ['orb%', 'orb_pct', 'oreb%']],
  ['drbPct',     ['drb%', 'drb_pct', 'dreb%']],
  ['trbPct',     ['trb%', 'trb_pct', 'reb%']],

  ['tsPct',      ['ts%', 'ts_pct']],
  ['efgPct',     ['efg%', 'efg_pct']],
  ['threePAr',   ['3pr', '3par', '3p_rate', '3pa_rate']],
  ['ftr',        ['ftr', 'ft_rate', 'fta_rate']],
];

function buildHeaderIndex(headers) {
  const lc = headers.map((h) => h.toLowerCase().trim());
  const out = {};
  for (const [outKey, candidates] of FIELD_MAP) {
    for (const c of candidates) {
      const idx = lc.indexOf(c.toLowerCase());
      if (idx >= 0) { out[outKey] = idx; break; }
    }
  }
  return out;
}

// ---------- Helpers ----------

function nameSlug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function num(v) {
  if (v == null || v === '' || v === '-') return null;
  // Strip percent signs / quotes
  const cleaned = String(v).replace(/[%"']/g, '').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// ---------- Main ----------

function main() {
  if (!fs.existsSync(BT_DIR)) {
    console.error('Missing directory:', BT_DIR);
    console.error('Create it and drop year CSVs (e.g., 2010.csv, 2009.csv) inside.');
    process.exit(1);
  }

  // Find all year CSVs
  const files = fs.readdirSync(BT_DIR)
    .filter((f) => /^\d{4}\.csv$/i.test(f))
    .map((f) => ({ year: parseInt(f.replace(/\.csv$/i, ''), 10), file: path.join(BT_DIR, f) }))
    .sort((a, b) => a.year - b.year);

  if (files.length === 0) {
    console.error('No year CSVs found in', BT_DIR);
    console.error('Expected filenames like 2003.csv, 2004.csv, ..., 2010.csv');
    console.error('See script header for browser export instructions.');
    process.exit(1);
  }

  console.log('=== BART TORVIK BPM IMPORT ===');
  console.log('Found CSV files for years:', files.map((f) => f.year).join(', '));
  console.log();

  // Build BartTorvik lookup: nameSlug → { season → record }
  // BartTorvik year=YYYY corresponds to season YYYY-1 / YYYY (e.g., year=2010 = 2009-10).
  const btBySlug = new Map();
  let btTotalRows = 0;
  for (const { year, file } of files) {
    const text = fs.readFileSync(file, 'utf8');
    const { headers, rows } = parseCsv(text);
    const idx = buildHeaderIndex(headers);
    if (idx.playerName == null || idx.bpm == null) {
      console.warn('  [' + year + '] Skipping — could not detect player or BPM column');
      console.warn('    headers:', headers.slice(0, 12).join(' | '));
      continue;
    }

    let imported = 0;
    for (const r of rows) {
      const nameRaw = Object.values(r)[idx.playerName];
      if (!nameRaw) continue;
      const slug = nameSlug(nameRaw);
      if (!slug) continue;

      // BartTorvik's convention: year=2010 = season ending 2010 = 2009-10
      const seasonKey = `${year - 1}-${String(year).slice(2)}`;

      const record = {
        playerName: nameRaw,
        season: seasonKey,
        team: idx.team != null ? Object.values(r)[idx.team] : null,
        bpm:   num(Object.values(r)[idx.bpm]),
        obpm:  idx.obpm != null ? num(Object.values(r)[idx.obpm]) : null,
        dbpm:  idx.dbpm != null ? num(Object.values(r)[idx.dbpm]) : null,
        ortg:  idx.ortg != null ? num(Object.values(r)[idx.ortg]) : null,
        drtg:  idx.drtg != null ? num(Object.values(r)[idx.drtg]) : null,
        per:   idx.per  != null ? num(Object.values(r)[idx.per])  : null,
        usgPct: idx.usgPct != null ? num(Object.values(r)[idx.usgPct]) : null,
        astPct: idx.astPct != null ? num(Object.values(r)[idx.astPct]) : null,
        tovPct: idx.tovPct != null ? num(Object.values(r)[idx.tovPct]) : null,
        stlPct: idx.stlPct != null ? num(Object.values(r)[idx.stlPct]) : null,
        blkPct: idx.blkPct != null ? num(Object.values(r)[idx.blkPct]) : null,
        orbPct: idx.orbPct != null ? num(Object.values(r)[idx.orbPct]) : null,
        drbPct: idx.drbPct != null ? num(Object.values(r)[idx.drbPct]) : null,
        trbPct: idx.trbPct != null ? num(Object.values(r)[idx.trbPct]) : null,
        tsPct:  idx.tsPct  != null ? num(Object.values(r)[idx.tsPct])  : null,
        efgPct: idx.efgPct != null ? num(Object.values(r)[idx.efgPct]) : null,
        threePAr: idx.threePAr != null ? num(Object.values(r)[idx.threePAr]) : null,
        ftr:      idx.ftr      != null ? num(Object.values(r)[idx.ftr])      : null,
      };

      if (!btBySlug.has(slug)) btBySlug.set(slug, new Map());
      btBySlug.get(slug).set(seasonKey, record);
      imported++;
    }
    btTotalRows += imported;
    console.log('  [' + year + '] parsed', imported, 'players (header span:', Object.keys(idx).length, 'detected fields)');
  }
  console.log('Total BartTorvik rows indexed:', btTotalRows);
  console.log('Distinct players in BartTorvik index:', btBySlug.size);
  console.log();

  // Load historical pool + advanced stats sidecar
  const historicals = JSON.parse(fs.readFileSync(HIST_PATH, 'utf8'));
  const adv         = JSON.parse(fs.readFileSync(ADV_PATH, 'utf8'));

  let matched = 0, unmatched = 0;
  let bpmFilled = 0, obpmFilled = 0, dbpmFilled = 0;
  let preExisting = 0;
  const noMatchList = [];

  for (const p of historicals) {
    if (!p.id || !p.name) continue;
    const slug = nameSlug(p.name);
    const btSeasons = btBySlug.get(slug);
    if (!btSeasons) {
      // Only flag pre-2011 misses (where this matters)
      if (p.draftYear && p.draftYear < 2011) noMatchList.push(p.name + ' (' + p.draftYear + ')');
      unmatched++;
      continue;
    }

    // Pick the latest season we have for this player (typically their final
    // college year — that's what historicalAdvancedStats.cbbAdv represents).
    const seasonKeys = [...btSeasons.keys()].sort();
    const lastSeason = seasonKeys[seasonKeys.length - 1];
    const bt = btSeasons.get(lastSeason);

    // Ensure adv entry + cbbAdv exist
    if (!adv[p.id]) adv[p.id] = {};
    if (!adv[p.id].cbbAdv) adv[p.id].cbbAdv = {};
    const ca = adv[p.id].cbbAdv;

    // Skip if all three core BPM fields already filled and not --force
    if (!FORCE && ca.bpm != null && ca.obpm != null && ca.dbpm != null) {
      preExisting++;
      continue;
    }

    matched++;

    // Merge — only fill nulls (or always overwrite if --force)
    function fill(key, value) {
      if (value == null) return false;
      if (FORCE || ca[key] == null) {
        ca[key] = value;
        return true;
      }
      return false;
    }

    if (fill('bpm',     bt.bpm))     bpmFilled++;
    if (fill('obpm',    bt.obpm))    obpmFilled++;
    if (fill('dbpm',    bt.dbpm))    dbpmFilled++;
    fill('ortg',    bt.ortg);
    fill('drtg',    bt.drtg);
    fill('per',     bt.per);
    fill('usgPct',  bt.usgPct);
    fill('astPct',  bt.astPct);
    fill('tovPct',  bt.tovPct);
    fill('stlPct',  bt.stlPct);
    fill('blkPct',  bt.blkPct);
    fill('orbPct',  bt.orbPct);
    fill('drbPct',  bt.drbPct);
    fill('trbPct',  bt.trbPct);
    fill('tsPct',   bt.tsPct);
    fill('efgPct',  bt.efgPct);
    fill('threePAr', bt.threePAr);

    // Track season + source so we know where this came from
    if (!ca.fromSeason) ca.fromSeason = lastSeason;
    if (!ca.toSeason)   ca.toSeason   = lastSeason;
    ca._btSource = 'bart-torvik:' + lastSeason + (FORCE ? ':force' : '');
  }

  fs.writeFileSync(ADV_PATH, JSON.stringify(adv, null, 2) + '\n');

  console.log('========== MERGE REPORT ==========');
  console.log('Historicals matched:        ', matched);
  console.log('Historicals unmatched:      ', unmatched);
  console.log('Historicals pre-existing:   ', preExisting, '(skipped; pass --force to overwrite)');
  console.log('---');
  console.log('BPM  fields filled:         ', bpmFilled);
  console.log('OBPM fields filled:         ', obpmFilled);
  console.log('DBPM fields filled:         ', dbpmFilled);
  console.log('==================================');
  console.log();
  console.log('Wrote', ADV_PATH);

  if (noMatchList.length > 0 && noMatchList.length <= 30) {
    console.log();
    console.log('Pre-2011 historicals not matched in BartTorvik (' + noMatchList.length + '):');
    for (const n of noMatchList) console.log('  -', n);
    console.log();
    console.log('Likely causes: BartTorvik name format differs (e.g., "C.J. McCollum" vs "CJ McCollum"),');
    console.log('player not in BartTorvik\'s D-I dataset, or season we pulled doesn\'t cover their career.');
  } else if (noMatchList.length > 30) {
    console.log();
    console.log('Pre-2011 unmatched: ' + noMatchList.length + ' (truncated, first 10):');
    for (const n of noMatchList.slice(0, 10)) console.log('  -', n);
  }

  console.log();
  console.log('Next: re-run scripts/scoring/backfill-historicals.ts to refit calibration with the closed gap.');
}

if (require.main === module) main();
module.exports = { parseCsv, buildHeaderIndex, nameSlug };
