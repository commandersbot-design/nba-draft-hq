#!/usr/bin/env node
// Backfill classifications on the per-year upstream historical files.
// Adds (when missing) outcomeTier, archetype, positionFamily, and a
// normalized position label, derived from already-fetched career stats and
// height. Hand-authored entries (those that already carry these fields) are
// left alone unless --force is set.

const fs = require('fs');
const path = require('path');

const HIST_DIR = path.join(__dirname, '..', '..', 'imports', 'upstream', 'historical');
const CATALOG_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'archetypeCatalog.json');

let CATALOG = null;
function loadCatalog() {
  if (CATALOG) return CATALOG;
  CATALOG = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  return CATALOG;
}

// Build a name -> Unique archetype lookup so historical players hardcoded as
// Uniques get their special name no matter what the heuristic would say.
let UNIQUE_LOOKUP = null;
function getUniqueLookup() {
  if (UNIQUE_LOOKUP) return UNIQUE_LOOKUP;
  const cat = loadCatalog();
  UNIQUE_LOOKUP = new Map();
  for (const arch of cat.archetypes) {
    if (arch.tier !== 'Unique') continue;
    for (const name of arch.exemplars || []) {
      UNIQUE_LOOKUP.set(name.toLowerCase().trim(), arch);
    }
  }
  return UNIQUE_LOOKUP;
}

function parseArgs(argv) {
  const args = { force: false, from: 2000, to: 2025 };
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i];
    if (value === '--force') args.force = true;
    else if (value === '--from') args.from = Number(argv[++i]);
    else if (value === '--to') args.to = Number(argv[++i]);
  }
  return args;
}

// ---------- HEIGHT PARSING ----------
function heightToInches(height) {
  if (!height) return null;
  const match = String(height).match(/(\d+)[\s'\-]+(\d+)/);
  if (!match) return null;
  const feet = Number(match[1]);
  const inches = Number(match[2]);
  if (!Number.isFinite(feet) || !Number.isFinite(inches)) return null;
  return feet * 12 + inches;
}

// ---------- POSITION NORMALIZATION ----------
function normalizePosition(rawPosition, heightInches) {
  if (!rawPosition && !heightInches) return { positionFamily: null, position: '' };
  const value = String(rawPosition || '').trim();
  const upper = value.toUpperCase();

  // Already-specific abbreviations
  if (/^PG$/.test(upper)) return { positionFamily: 'Guard', position: 'PG' };
  if (/^SG$/.test(upper)) return { positionFamily: 'Guard', position: 'SG' };
  if (/^SF$/.test(upper)) return { positionFamily: 'Wing', position: 'SF' };
  if (/^PF$/.test(upper)) return { positionFamily: 'Forward', position: 'PF' };
  if (/^C$/.test(upper)) return { positionFamily: 'Big', position: 'C' };
  if (/^G\/F$|^GF$|^G-F$/.test(upper)) return { positionFamily: 'Wing', position: 'SG/SF' };
  if (/^F\/C$|^FC$|^F-C$/.test(upper)) return { positionFamily: 'Big', position: 'PF/C' };
  if (/^F\/G$|^FG$|^F-G$/.test(upper)) return { positionFamily: 'Wing', position: 'SF/SG' };

  // NBA-API formats: "Guard", "Forward", "Center", "Forward-Center"
  if (/^GUARD$/i.test(value)) {
    if (heightInches != null) {
      return heightInches >= 76
        ? { positionFamily: 'Guard', position: 'SG' }
        : { positionFamily: 'Guard', position: 'PG' };
    }
    return { positionFamily: 'Guard', position: 'G' };
  }
  if (/^FORWARD$/i.test(value)) {
    if (heightInches != null) {
      if (heightInches >= 81) return { positionFamily: 'Forward', position: 'PF' };
      return { positionFamily: 'Wing', position: 'SF' };
    }
    return { positionFamily: 'Wing', position: 'F' };
  }
  if (/^CENTER$/i.test(value)) {
    return { positionFamily: 'Big', position: 'C' };
  }
  if (/forward[-\s]?center|center[-\s]?forward/i.test(value)) {
    return { positionFamily: 'Big', position: 'PF/C' };
  }
  if (/forward[-\s]?guard|guard[-\s]?forward/i.test(value)) {
    return { positionFamily: 'Wing', position: 'SF/SG' };
  }
  if (/guard[-\s]?center/i.test(value)) {
    return { positionFamily: 'Wing', position: 'G/F' };
  }

  // Fallback: derive purely from height
  if (heightInches != null) {
    if (heightInches >= 81) return { positionFamily: 'Big', position: 'C' };
    if (heightInches >= 79) return { positionFamily: 'Forward', position: 'PF' };
    if (heightInches >= 76) return { positionFamily: 'Wing', position: 'SF' };
    return { positionFamily: 'Guard', position: 'PG' };
  }

  return { positionFamily: null, position: value };
}

// ---------- OUTCOME TIER ----------
// Tier meanings (derived):
//   Star    : true difference-makers — top quartile of starters
//   Hit     : long-time rotation / starter
//   Swing   : platoon / fringe rotation; could have broken either way
//   Bust    : sub-rotation / never stuck
function classifyOutcome(prospect) {
  // Sports Reference stats are the gold-standard signal when present.
  const sr = prospect.srNbaStats || null;
  if (sr) {
    const ws = Number(sr.winShares) || 0;
    const allStar = Number(sr.allStarSelections) || 0;
    const games = Number(sr.games) || 0;
    if (allStar >= 3) return 'Star';
    if (ws >= 80) return 'Star';
    if (allStar >= 1) return 'Hit';      // any All-Star nod ⇒ at least Hit
    if (ws >= 30) return 'Hit';
    if (ws >= 10 || games >= 400) return 'Swing';
    if (ws >= 3 || games >= 200) return 'Swing';
    return 'Bust';
  }

  const career = prospect.nbaStats || {};
  const games = Number(career.careerGames) || 0;
  // careerMinutes from NBA stats is per-game (MPG), not totals — use games only.
  const mpg = Number(career.careerMinutes) || 0;
  const ppg = prospect.pointsPerGame ?? Number(career.careerPpg) ?? 0;
  const rpg = prospect.reboundsPerGame ?? Number(career.careerRpg) ?? 0;
  const apg = prospect.assistsPerGame ?? Number(career.careerApg) ?? 0;
  const bpm = prospect.bpm ?? null;

  // Never made the league at all
  if (games < 30) return 'Bust';

  // BPM heuristic when available (rare — most records lack BPM)
  if (bpm != null) {
    if (bpm >= 4) return 'Star';
    if (bpm >= 1) return 'Hit';
    if (bpm >= -2 && games >= 200) return 'Swing';
    return 'Bust';
  }

  // Stats-only fallback. Combine per-game production with longevity.
  const impact = ppg + rpg * 0.7 + apg * 1.2;
  if (impact >= 22 && games >= 400) return 'Star';
  if (impact >= 16 && games >= 250) return 'Hit';
  if (impact >= 18 && games >= 150) return 'Hit'; // high-volume, shorter career still counts
  if (mpg >= 22 && games >= 400) return 'Hit';     // long-career rotation player
  if (impact >= 8 && games >= 100) return 'Swing';
  if (mpg >= 15 && games >= 200) return 'Swing';
  return 'Bust';
}

// ---------- ARCHETYPE ----------
// Pick a Set C / Star archetype from the catalog by stat-profile heuristic.
// Uniques are excluded here — they're assigned by hardcoded name lookup before
// this function runs.
function classifyArchetype(prospect, positionFamily) {
  const cat = loadCatalog();
  const ppg = prospect.pointsPerGame ?? Number(prospect.nbaStats?.careerPpg) ?? 0;
  const rpg = prospect.reboundsPerGame ?? Number(prospect.nbaStats?.careerRpg) ?? 0;
  const apg = prospect.assistsPerGame ?? Number(prospect.nbaStats?.careerApg) ?? 0;
  const spg = Number(prospect.nbaStats?.careerSpg) || 0;
  const bpg = Number(prospect.nbaStats?.careerBpg) || 0;
  const tsPct = prospect.srNbaStats?.tsPct ?? null;
  const threePct = prospect.srNbaStats?.threePct ?? null;
  const ws = Number(prospect.srNbaStats?.winShares) || 0;

  // Helper to fetch an archetype name by key (asserts presence)
  const named = (key) => {
    const a = cat.archetypes.find((x) => x.key === key);
    return a ? a.name : 'Unclassified';
  };

  if (positionFamily === 'Guard') {
    // Star-tier playmakers
    if (apg >= 6 && ppg >= 16) return named('lead-initiator');
    if (apg >= 6) return named('iq-lead');
    // Star-tier scorers
    if (ppg >= 22 && ws >= 50) return named('high-usage-lead');
    if (ppg >= 18 && apg >= 4) return named('volume-lead-guard');
    if (ppg >= 17 && apg < 4) return named('bench-scoring-guard');
    // Defenders + specialists
    if (spg >= 1.5 && ppg < 14) return named('poa-defender');
    if (threePct != null && threePct >= 38 && ppg < 12) return named('spot-up-specialist');
    return named('iq-lead');
  }

  if (positionFamily === 'Wing') {
    if (ppg >= 22 && ws >= 60) return named('off-ball-wing-scorer'); // high-usage scoring wing
    if (ppg >= 17 && apg >= 3 && spg >= 1.0) return named('two-way-wing');
    if (ppg >= 17 && apg >= 3) return named('off-ball-wing-scorer');
    if (threePct != null && threePct >= 38 && spg >= 1.0) return named('three-and-d');
    if (ppg >= 13 && (threePct != null && threePct >= 36)) return named('movement-shooter');
    if (apg >= 3 && rpg >= 4) return named('connector');
    if (ppg >= 14) return named('off-ball-wing');
    return named('connector');
  }

  if (positionFamily === 'Forward') {
    if (ppg >= 18 && (apg >= 3 || spg >= 1.0)) return named('versatile-forward');
    if (ppg >= 16 && rpg >= 6 && (threePct != null && threePct >= 32)) return named('combo-forward');
    if (rpg >= 8 && apg >= 2) return named('connector-four');
    if (threePct != null && threePct >= 35) return named('stretch-four');
    if (ppg >= 14) return named('combo-forward');
    return named('connector-four');
  }

  if (positionFamily === 'Big') {
    if (apg >= 4 && ppg >= 15) return named('skilled-center');
    if (bpg >= 1.8 && rpg >= 8) return named('rim-protector');
    if (threePct != null && threePct >= 35) return named('floor-spacing-big');
    if (apg >= 2 && ppg >= 12 && (threePct == null || threePct < 32)) return named('pick-and-pop-big');
    if (rpg >= 9 && bpg >= 1.0) return named('rim-running-big');
    if (rpg >= 7 && spg >= 0.8) return named('switching-big');
    return named('rim-running-big');
  }

  return 'Unclassified';
}

// ---------- ENRICH ONE ----------
function classifyProspect(prospect, force) {
  const heightInches = heightToInches(prospect.height);
  const { positionFamily: famExisting, position: posNormalized } = normalizePosition(
    prospect.position,
    heightInches
  );

  let positionFamily = prospect.positionFamily || famExisting || null;
  let position = prospect.position;
  if (force || !position || /^(guard|forward|center)$/i.test(position) || !positionFamily) {
    positionFamily = famExisting || positionFamily;
    if (posNormalized) position = posNormalized;
  }

  let outcomeTier = prospect.outcomeTier;
  if (force || !outcomeTier) outcomeTier = classifyOutcome(prospect);

  // Hardcoded Unique override: certain players always get their special archetype.
  const uniqueLookup = getUniqueLookup();
  const uniqueHit = uniqueLookup.get(String(prospect.name || '').toLowerCase().trim());

  let archetype = prospect.archetype;
  let archetypeTier = prospect.archetypeTier || null;
  if (uniqueHit) {
    archetype = uniqueHit.name;
    archetypeTier = 'Unique';
    // Force outcome to Star for Uniques — these are all generational players.
    if (outcomeTier !== 'Star') outcomeTier = 'Star';
  } else if (force || !archetype) {
    archetype = classifyArchetype(prospect, positionFamily);
    // Look up the tier for the chosen archetype
    const cat = loadCatalog();
    const matched = cat.archetypes.find((a) => a.name === archetype);
    archetypeTier = matched ? matched.tier : null;
  }

  let archetypeFamily = prospect.archetypeFamily;
  if (force || !archetypeFamily) {
    archetypeFamily = positionFamily || 'Unknown';
  }

  return { ...prospect, position, positionFamily, archetype, archetypeFamily, archetypeTier, outcomeTier };
}

// ---------- DRIVER ----------
async function processYear(year, args) {
  const target = path.join(HIST_DIR, `${year}.json`);
  if (!fs.existsSync(target)) return null;
  const records = JSON.parse(fs.readFileSync(target, 'utf8'));
  let updated = 0;
  const next = records.map((p) => {
    const before = JSON.stringify({
      position: p.position,
      positionFamily: p.positionFamily,
      archetype: p.archetype,
      outcomeTier: p.outcomeTier,
    });
    const enriched = classifyProspect(p, args.force);
    const after = JSON.stringify({
      position: enriched.position,
      positionFamily: enriched.positionFamily,
      archetype: enriched.archetype,
      outcomeTier: enriched.outcomeTier,
    });
    if (before !== after) updated++;
    return enriched;
  });
  fs.writeFileSync(target, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`YEAR ${year}: updated ${updated} of ${records.length}`);
  return updated;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Classifying ${args.from}-${args.to}${args.force ? ' (force overwrite)' : ''}`);
  let total = 0;
  for (let year = args.from; year <= args.to; year++) {
    const updated = await processYear(year, args);
    if (updated != null) total += updated;
  }
  console.log(`\nUpdated ${total} historical records.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { classifyProspect, normalizePosition, classifyOutcome, classifyArchetype };
