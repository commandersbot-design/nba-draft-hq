#!/usr/bin/env node
// Read the Stathead "current active CBB" career-totals CSV and produce a
// sidecar JSON of advanced stats for the active 2026 class. These fields
// (STL%, BLK%, OBPM, DBPM, PER, ORB%, DRB%, 3PAr) aren't in the existing
// profileStats.json — this gap-fills them so the percentile system + comp
// engine can use them on equal footing with the historical pool.
//
// Output: src/data/prospectAdvancedExtras.json
//   Keyed by name slug (e.g., "ajdybantsa") to match the existing
//   profileStats.json convention. Loaded at runtime and merged into
//   stats.advanced for each prospect.
//
// Source: imports/upstream/stathead/stathead-cbb-current-active.csv
// Active class: src/data/prospectAliases.json (entries where active=true)

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', '..', 'imports', 'upstream', 'stathead', 'stathead-cbb-current-active.csv');
const ALIASES_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'prospectAliases.json');
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'prospectAdvancedExtras.json');

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
    // When duplicate column names exist (Stathead repeats sort columns),
    // the LATER occurrence wins via this iteration. That's actually what we
    // want — the standard Advanced panel comes after the sort columns and
    // has the canonical values.
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = fields[j];
    rows.push(obj);
  }
  return { headers, rows };
}

// ---------- HELPERS ----------
const toNum = (v) => { if (v == null || v === '' || v === '-') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const toPct = (v) => toNum(v); // already in percent scale (e.g., "33.9" for USG%)
// SR shooting decimals (".600") → percent scale (60.0)
const decimalToPct = (v) => { const n = toNum(v); if (n == null) return null; return Math.round(n * 1000) / 10; };
const nameSlug = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Some prospects in the alias roster have suffix variations vs the SR file
// (e.g., "Tarris Reed" vs "Tarris Reed Jr.", "Nate Bittle" vs "Nathan Bittle",
// "Silas DeMary" vs "Silas Demary Jr.", "Mikel Brown" vs "Mikel Brown Jr.",
// "Darius Acuff" vs "Darius Acuff Jr.", "Benett Stirtz" vs "Bennett Stirtz",
// "Pryce Sandfort" vs "Payton Sandfort"... wait that last one is wrong).
// Manual aliases for slug matching when needed.
const SLUG_ALIASES = {
  'tarrisreed':         ['tarrisreedjr'],
  'natebittle':         ['nathanbittle'],
  'silasdemary':        ['silasdemaryjr'],
  'mikelbrown':         ['mikelbrownjr'],
  'dariusacuff':        ['dariusacuffjr'],
  'benettstirtz':       ['bennettstirtz'],
  'chriscenac':         ['chriscenacjr'],
  'paulmcneil':         ['paulmcneiljr'],
  // Pryce Sandfort is the YOUNGER brother of Payton Sandfort — they're different people.
  // The CSV has Payton; if Pryce is also there he'll be elsewhere. Don't alias these.
};

// ---------- ROW EXTRACTOR ----------
// New CSV format includes the primitive box-score columns (FGA, 3P, 3PA, FT,
// FTA, PF, MP, G) alongside the rate stats. We compute the derived rates
// locally so we don't depend on Stathead's per-era data availability:
//   FTr      = FTA / FGA          — free throw / aggression rate
//   threePAr = 3PA / FGA          — 3-point attempt rate
//   pfRate   = PF / (MP / 40 * 70) ≈ fouls per 100 possessions (NCAA pace approx)
function extractAdvancedExtras(row) {
  const fga = toNum(row['FGA']);
  const fta = toNum(row['FTA']);
  const ft  = toNum(row['FT']);
  const threeP  = toNum(row['3P']);
  const threePA = toNum(row['3PA']);
  const pf  = toNum(row['PF']);
  const mp  = toNum(row['MP']);
  const g   = toNum(row['G']);
  const pts = toNum(row['PTS']);

  // Compute derived rates with safety
  const ftr = (fta != null && fga != null && fga > 0)
    ? Math.round((fta / fga) * 1000) / 10  // 0-100 scale
    : null;
  const threePArComputed = (threePA != null && fga != null && fga > 0)
    ? Math.round((threePA / fga) * 1000) / 10
    : null;
  // PFr: per-100-possession approximation. NCAA average pace ~70 poss/40min,
  // so per-100 = PF / MP * 40 * 100/70 = PF / MP * 57.14.
  const pfr = (pf != null && mp != null && mp > 0)
    ? Math.round((pf / mp) * 5714) / 100  // round to 2 decimals
    : null;
  // TS% locally computed from primitives — cross-validates the SR values
  const tsComputed = (pts != null && fga != null && fta != null && (fga + 0.44 * fta) > 0)
    ? Math.round((pts / (2 * (fga + 0.44 * fta))) * 1000) / 10
    : null;
  // eFG%
  const efgComputed = (fga != null && fga > 0 && row['FG'] != null)
    ? Math.round(((toNum(row['FG']) + 0.5 * (threeP || 0)) / fga) * 1000) / 10
    : null;

  return {
    stlPct:   toPct(row['STL%']),
    blkPct:   toPct(row['BLK%']),
    obpm:     toNum(row['OBPM']),
    dbpm:     toNum(row['DBPM']),
    per:      toNum(row['PER']),
    orbPct:   toPct(row['ORB%']),
    drbPct:   toPct(row['DRB%']),
    // Derived from primitives — finally have FTr and PFr
    threePAr: threePArComputed != null ? threePArComputed : decimalToPct(row['3PAr']),
    ftr:      ftr,
    pfr:      pfr,
    tsPct:    tsComputed != null ? tsComputed : decimalToPct(row['TS%']),
    efgPct:   efgComputed != null ? efgComputed : decimalToPct(row['eFG%']),
    // Career totals for context
    careerPts: pts,
    careerG:   g,
    careerMP:  mp,
    fromSeason: row['From'] || null,
    toSeason:   row['To'] || null,
    school:    row['Team'] || null,
    srSlug:    row['Player-additional'] || null,
  };
}

// ---------- DRIVER ----------
function main() {
  if (!fs.existsSync(CSV_PATH)) { console.error('Missing ' + CSV_PATH); process.exit(1); }
  if (!fs.existsSync(ALIASES_PATH)) { console.error('Missing ' + ALIASES_PATH); process.exit(1); }

  const aliases = JSON.parse(fs.readFileSync(ALIASES_PATH, 'utf8'));
  const activeProspects = (aliases.entries || []).filter((e) => e.active !== false);
  const activeBySlug = new Map();
  for (const e of activeProspects) {
    activeBySlug.set(nameSlug(e.name), e);
  }

  const { rows } = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
  console.log('Loaded ' + rows.length + ' rows from CSV');
  console.log('Active 2026 prospects in alias roster: ' + activeProspects.length);
  console.log('');

  const sidecar = {};
  const matched = [];
  for (const row of rows) {
    if (!row.Player) continue;
    let slug = nameSlug(row.Player);
    // Try direct match
    let entry = activeBySlug.get(slug);
    // Try slug aliases
    if (!entry) {
      for (const [canonical, alts] of Object.entries(SLUG_ALIASES)) {
        if (alts.includes(slug)) {
          entry = activeBySlug.get(canonical);
          if (entry) { slug = canonical; break; }
        }
      }
    }
    if (!entry) continue;
    // Take the FIRST row per active prospect (CSV is sorted by career PTS DESC,
    // so first row is the most-recent / most-comprehensive career total). Skip
    // duplicates to avoid an older incomplete season overwriting the canonical row.
    if (sidecar[slug]) continue;
    sidecar[slug] = extractAdvancedExtras(row);
    matched.push(entry.name);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sidecar, null, 2) + '\n');

  console.log('========== COVERAGE ==========');
  console.log('Active prospects matched: ' + matched.length + ' / ' + activeProspects.length);
  console.log('==============================');
  console.log('');

  const missing = activeProspects.filter((e) => !matched.includes(e.name)).map((e) => e.name);
  if (missing.length > 0) {
    console.log('Active prospects NOT in CSV (' + missing.length + '):');
    for (const n of missing) console.log('  - ' + n);
    console.log('');
    console.log('Likely reasons: international (no NCAA), insufficient career PTS for the SR ranking cutoff, or name variation not yet in SLUG_ALIASES.');
  }
  console.log('');
  console.log('Wrote ' + Object.keys(sidecar).length + ' entries to ' + OUTPUT_PATH);
}

if (require.main === module) main();
module.exports = { extractAdvancedExtras, parseCsv, nameSlug };
